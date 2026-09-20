"""Compute: Bedrock simulation_fn (services.simulate).

Sandbox execution lives in Bedrock AgentCore Runtime (cdk/stacks/agentcore.py),
not here. This stack owns no agent task definitions.
"""
import os

import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_lambda as _lambda,
)

from backend_asset import backend_code

# Anthropic Marketplace models need a valid payment instrument; until then
# use Amazon Nova in us-east-1 (not available on-demand in ap-south-2).
BEDROCK_MODEL_IDS = {
    "demo": "amazon.nova-micro-v1:0",
    "private": "amazon.nova-lite-v1:0",
}
BEDROCK_REGIONS = {
    "demo": "us-east-1",
    "private": "us-east-1",
}


class Compute(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, network, storage, graph=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        self.bedrock_model_id = BEDROCK_MODEL_IDS[mode]
        self.bedrock_region = BEDROCK_REGIONS[mode]
        code = backend_code()

        # NOTE: sandbox agent execution is Bedrock AgentCore Runtime
        # (cdk/stacks/agentcore.py). No placeholder Fargate task lives here.

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
                "BEDROCK_REGION": self.bedrock_region,
                "TYPESAFE_API_KEY": os.environ.get("TYPESAFE_API_KEY", ""),
                "JEV_MODEL": os.environ.get("JEV_MODEL", "jev-latest"),
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
                        "neptune-db:DeleteDataViaQuery",
                    ],
                    resources=["*"],
                )
            )
