"""Neptune Serverless + query/builder Lambdas using services.graph.app."""
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_events as events,
    aws_events_targets as targets,
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_neptune as neptune,
)

from backend_asset import backend_code


class Graph(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, network, storage=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        is_demo = mode == "demo"
        code = backend_code()

        self.subnet_group = neptune.CfnDBSubnetGroup(
            self,
            "SubnetGroup",
            db_subnet_group_description=f"AgentGarage {mode} neptune subnets",
            subnet_ids=[s.subnet_id for s in network.vpc.private_subnets],
        )

        self.cluster = neptune.CfnDBCluster(
            self,
            "Cluster",
            storage_encrypted=True,
            kms_key_id=storage.key.key_arn if storage is not None else None,
            db_subnet_group_name=self.subnet_group.ref,
            vpc_security_group_ids=[network.neptune_sg.security_group_id],
            iam_auth_enabled=True,
            deletion_protection=not is_demo,
            db_port=8182,
            serverless_scaling_configuration=neptune.CfnDBCluster.ServerlessScalingConfigurationProperty(
                min_capacity=1.0 if is_demo else 2.5,
                max_capacity=128.0 if is_demo else 256.0,
            ),
        )
        self.cluster.add_resource_dependency(self.subnet_group)

        self.instance = neptune.CfnDBInstance(
            self,
            "Instance",
            db_cluster_identifier=self.cluster.ref,
            db_instance_class="db.serverless",
            allow_major_version_upgrade=False,
            auto_minor_version_upgrade=True,
        )
        self.instance.add_resource_dependency(self.cluster)

        self.cluster_endpoint = self.cluster.get_att("Endpoint").to_string()

        env = {
            "MODE": mode,
            "NEPTUNE_ENDPOINT": self.cluster_endpoint,
        }
        if storage is not None:
            env["TRACES_BUCKET"] = storage.traces_bucket.bucket_name
            env["SESSIONS_TABLE"] = storage.sessions_table.table_name
            env["JOBS_TABLE"] = storage.jobs_table.table_name
            env["EVALS_TABLE"] = storage.evals_table.table_name
            env["EVALS_BUCKET"] = storage.evals_bucket.bucket_name
            env["SANDBOXES_BUCKET"] = storage.sandbox_logs_bucket.bucket_name

        self.graph_query_fn = _lambda.Function(
            self,
            "QueryFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="services.graph.app.lambda_handler",
            code=code,
            vpc=network.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[network.lambda_sg],
            timeout=cdk.Duration.seconds(30),
            memory_size=512,
            environment=env,
        )
        self.graph_query_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "neptune-db:connect",
                    "neptune-db:ReadDataViaQuery",
                    "neptune-db:WriteDataViaQuery",
                ],
                resources=["*"],
            )
        )

        self.graph_builder_fn = _lambda.Function(
            self,
            "BuilderFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="services.graph.app.lambda_handler",
            code=code,
            vpc=network.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[network.lambda_sg],
            timeout=cdk.Duration.seconds(60),
            memory_size=512,
            environment=env,
        )
        self.graph_builder_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "neptune-db:connect",
                    "neptune-db:ReadDataViaQuery",
                    "neptune-db:WriteDataViaQuery",
                ],
                resources=["*"],
            )
        )
        if storage is not None:
            storage.traces_bucket.grant_read(self.graph_builder_fn)
            storage.traces_bucket.grant_read(self.graph_query_fn)
            storage.sessions_table.grant_read_data(self.graph_query_fn)
            storage.jobs_table.grant_read_data(self.graph_query_fn)
            # EventBridge (not S3 notification) avoids Storage <-> Graph cycle
            events.Rule(
                self,
                "TraceArrival",
                event_pattern=events.EventPattern(
                    source=["aws.s3"],
                    detail_type=["Object Created"],
                    detail={"bucket": {"name": [storage.traces_bucket.bucket_name]}},
                ),
                targets=[targets.LambdaFunction(self.graph_builder_fn)],
            )
