"""Intake: ECS OTLP collector -> Kinesis -> redact_fn -> S3 + DDB.

Kinesis Data Stream (on-demand, KMS). Retention 24h demo / 7d private.
redact_fn: EventSourceMapping batch 100, bisect-on-error, SQS DLQ.
Collector: Fargate service + ALB (public + API key in demo,
internal ALB in private). CloudWatch lag alarm on iterator age.

All SGs are local to this stack (no mutation of Network SGs) to keep
NestedStack dependencies one-way (Intake -> Network, never reverse).
"""
import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cw,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_iam as iam,
    aws_kinesis as kinesis,
    aws_lambda as _lambda,
    aws_lambda_event_sources as lambda_sources,
    aws_sqs as sqs,
)

from backend_asset import backend_code

REDACT_CODE = None  # replaced by services.collector


class Intake(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, network, storage, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        is_demo = mode == "demo"
        code = backend_code()

        self.stream = kinesis.Stream(
            self,
            "TraceStream",
            stream_mode=kinesis.StreamMode.ON_DEMAND,
            encryption=kinesis.StreamEncryption.KMS,
            encryption_key=storage.key,
            retention_period=cdk.Duration.hours(24)
            if is_demo
            else cdk.Duration.days(7),
        )

        # Local SGs (do NOT reuse network.* SGs: mutating them from here
        # would create a Network <-> Intake circular nested-stack dependency).
        alb_sg = ec2.SecurityGroup(
            self, "AlbSG", vpc=network.vpc, allow_all_outbound=True
        )
        if is_demo:
            alb_sg.add_ingress_rule(
                peer=ec2.Peer.any_ipv4(),
                connection=ec2.Port.tcp(4318),
                description="OTLP HTTP in demo",
            )
        else:
            alb_sg.add_ingress_rule(
                peer=ec2.Peer.ipv4(network.vpc.vpc_cidr_block),
                connection=ec2.Port.tcp(4318),
                description="OTLP HTTP VPC-internal in private",
            )
        svc_sg = ec2.SecurityGroup(
            self, "SvcSG", vpc=network.vpc, allow_all_outbound=True
        )
        svc_sg.add_ingress_rule(
            peer=alb_sg,
            connection=ec2.Port.tcp(4318),
            description="ALB to collector",
        )

        self.collector_cluster = ecs.Cluster(
            self, "CollectorCluster", vpc=network.vpc
        )
        task = ecs.FargateTaskDefinition(
            self, "CollectorTask", cpu=512, memory_limit_mib=1024
        )
        task.add_container(
            "Otlp",
            image=ecs.ContainerImage.from_registry(
                "public.ecr.aws/aws-observability/aws-otel-collector:v0.38.1"
            ),
            port_mappings=[ecs.PortMapping(container_port=4318)],
            logging=ecs.LogDrivers.aws_logs(stream_prefix="collector"),
            environment={"MODE": mode},
        )
        service = ecs.FargateService(
            self,
            "CollectorService",
            cluster=self.collector_cluster,
            task_definition=task,
            desired_count=1 if is_demo else 2,
            assign_public_ip=False,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[svc_sg],
            circuit_breaker=ecs.DeploymentCircuitBreaker(rollback=True),
            min_healthy_percent=100,
        )

        alb = elbv2.ApplicationLoadBalancer(
            self,
            "CollectorAlb",
            vpc=network.vpc,
            internet_facing=is_demo,
            security_group=alb_sg,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
                if is_demo
                else ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )
        listener = alb.add_listener(
            "OtlpListener", port=4318, protocol=elbv2.ApplicationProtocol.HTTP
        )
        # ADOT collector has no HTTP root; OTLP / returns 404. Accept it so
        # the ALB target group can mark tasks healthy (TCP not allowed on ALB HTTP).
        listener.add_targets(
            "CollectorTargets",
            port=4318,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[service.load_balancer_target(container_name="Otlp")],
            health_check=elbv2.HealthCheck(
                path="/",
                healthy_http_codes="200,404",
            ),
        )
        self.collector_service = service
        self.collector_url = f"http://{alb.load_balancer_dns_name}:4318"

        self.dlq = sqs.Queue(
            self, "RedactDLQ", encryption_master_key=storage.key
        )

        self.redact_fn = _lambda.Function(
            self,
            "RedactFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="services.collector.app.lambda_handler",
            code=code,
            vpc=network.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[
                ec2.SecurityGroup(
                    self, "LambdaSG", vpc=network.vpc, allow_all_outbound=True
                )
            ],
            timeout=cdk.Duration.seconds(60),
            memory_size=512,
            environment={
                "MODE": mode,
                "TRACES_BUCKET": storage.traces_bucket.bucket_name,
                "SESSIONS_TABLE": storage.sessions_table.table_name,
                "JOBS_TABLE": storage.jobs_table.table_name,
                "EVALS_TABLE": storage.evals_table.table_name,
                "EVALS_BUCKET": storage.evals_bucket.bucket_name,
                "SANDBOXES_BUCKET": storage.sandbox_logs_bucket.bucket_name,
            },
        )
        self.redact_fn.add_event_source(
            lambda_sources.KinesisEventSource(
                self.stream,
                batch_size=100,
                bisect_batch_on_error=True,
                on_failure=lambda_sources.SqsDlq(self.dlq),
                starting_position=_lambda.StartingPosition.TRIM_HORIZON,
            )
        )
        storage.traces_bucket.grant_write(self.redact_fn)
        storage.sessions_table.grant_write_data(self.redact_fn)
        self.stream.grant_read(self.redact_fn)

        task.task_role.add_to_principal_policy(
            iam.PolicyStatement(
                actions=["kinesis:PutRecord", "kinesis:PutRecords"],
                resources=[self.stream.stream_arn],
            )
        )

        cw.Alarm(
            self,
            "IteratorAgeAlarm",
            metric=self.stream.metric_get_records_iterator_age_milliseconds(
                period=cdk.Duration.minutes(5)
            ),
            threshold=60_000,
            evaluation_periods=2,
            alarm_description="Kinesis redact lag (iterator age ms)",
        )
