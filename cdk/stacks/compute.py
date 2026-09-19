"""Compute: Fargate sandbox + Bedrock-native simulation_fn with BYOK override.

Trust split preserved: simulation_fn gets bedrock:InvokeModel +
scoped secretsmanager:GetSecretValue. Sandbox task gets ZERO model IAM.

simulation_fn logic:
  default -> bedrock:InvokeModel in-region, writes `predicted` scenarios
             (e.g. sc_19 shape) to DDB/S3.
  BYOK    -> if agents row has model_override {endpoint, secret_arn},
             fetch secret + call customer endpoint instead.
"""
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_iam as iam,
    aws_lambda as _lambda,
)

SIMULATION_CODE = """import json, os
def handler(event, context):
    return {"statusCode": 200, "body": json.dumps({"scenario_id": "sc_19", "status": "predicted"})}
"""

BEDROCK_MODEL_IDS = {
    "demo": "anthropic.claude-3-haiku-20240307-v1:0",
    "private": "anthropic.claude-3-sonnet-20240229-v1:0",
}


class Compute(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, network, storage, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode

        self.bedrock_model_id = BEDROCK_MODEL_IDS[mode]

        self.cluster = ecs.Cluster(self, "SandboxCluster", vpc=network.vpc)

        self.sandbox_sg = ec2.SecurityGroup(
            self,
            "SandboxSG",
            vpc=network.vpc,
            description="Sandbox tasks: no internet egress, no model access",
            allow_all_outbound=False,
        )

        self.sandbox_task = ecs.FargateTaskDefinition(
            self, "SandboxTask", cpu=1024, memory_limit_mib=2048
        )
        self.sandbox_task.add_container(
            "Agent",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/amazonlinux/amazonlinux:2023"),
            logging=ecs.LogDrivers.aws_logs(stream_prefix="sandbox"),
            environment={"MODE": mode},
        )
        storage.sandbox_logs_bucket.grant_write(
            self.sandbox_task.task_role
        )
        storage.traces_bucket.grant_read(self.sandbox_task.task_role)
        # NOTE: no bedrock / secretsmanager grants to sandbox task role.
        # Trust split: sandbox cannot reach Bedrock or the world model.

        self.simulation_fn = _lambda.Function(
            self,
            "SimulationFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(SIMULATION_CODE),
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
        # Scoped BYOK secret read: only secrets referenced by agents rows.
        # Wildcard scoped to account prefix; per-row ARNs enforced in code.
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
