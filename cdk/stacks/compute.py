"""Compute: Fargate sandbox + Bedrock simulation_fn (services.simulate)."""
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_iam as iam,
    aws_lambda as _lambda,
)

from backend_asset import backend_code

BEDROCK_MODEL_IDS = {
    "demo": "anthropic.claude-haiku-4-5-20251001-v1:0",
    "private": "anthropic.claude-sonnet-4-20250514-v1:0",
}


class Compute(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, network, storage, graph=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        self.bedrock_model_id = BEDROCK_MODEL_IDS[mode]
        code = backend_code()

        self.cluster = ecs.Cluster(self, "SandboxCluster", vpc=network.vpc)

        self.sandbox_sg = ec2.SecurityGroup(
            self,
            "SandboxSG",
            vpc=network.vpc,
            description="Sandbox tasks: reserved for future Fargate agent image",
            allow_all_outbound=False,
        )

        self.sandbox_task = ecs.FargateTaskDefinition(
            self, "SandboxTask", cpu=1024, memory_limit_mib=2048
        )
        self.sandbox_task.add_container(
            "Agent",
            image=ecs.ContainerImage.from_registry(
                "public.ecr.aws/amazonlinux/amazonlinux:2023"
            ),
            logging=ecs.LogDrivers.aws_logs(stream_prefix="sandbox"),
            environment={"MODE": mode},
        )
        storage.sandbox_logs_bucket.grant_write(self.sandbox_task.task_role)

        neptune_ep = graph.cluster_endpoint if graph is not None else ""
        self.simulation_fn = _lambda.Function(
            self,
            "SimulationFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="services.simulate.app.lambda_handler",
            code=code,
            vpc=network.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[network.lambda_sg],
            timeout=cdk.Duration.seconds(120),
            memory_size=1024,
            environment={
                "MODE": mode,
                "AGENTS_TABLE": storage.agents_table.table_name,
                "JOBS_TABLE": storage.jobs_table.table_name,
                "TRACES_BUCKET": storage.traces_bucket.bucket_name,
                "SANDBOXES_BUCKET": storage.sandbox_logs_bucket.bucket_name,
                "EVALS_BUCKET": storage.evals_bucket.bucket_name,
                "SESSIONS_TABLE": storage.sessions_table.table_name,
                "EVALS_TABLE": storage.evals_table.table_name,
                "NEPTUNE_ENDPOINT": neptune_ep,
                "BEDROCK_MODEL_ID": self.bedrock_model_id,
                "BEDROCK_REGION": cdk.Stack.of(self).region,
            },
        )
        self.simulation_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
                resources=["*"],
            )
        )
        self.simulation_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["secretsmanager:GetSecretValue"],
                resources=[
                    f"arn:aws:secretsmanager:{cdk.Stack.of(self).region}:"
                    f"{cdk.Stack.of(self).account}:secret:agentgarage/*"
                ],
            )
        )
        storage.agents_table.grant_read_write_data(self.simulation_fn)
        storage.jobs_table.grant_read_write_data(self.simulation_fn)
        storage.traces_bucket.grant_read_write(self.simulation_fn)
        if graph is not None:
            self.simulation_fn.add_to_role_policy(
                iam.PolicyStatement(
                    actions=[
                        "neptune-db:connect",
                        "neptune-db:ReadDataViaQuery",
                        "neptune-db:WriteDataViaQuery",
                    ],
                    resources=["*"],
                )
            )
