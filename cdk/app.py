"""AgentGarage CDK entry. One codebase, two modes.

mode=demo:    public collector + self-signup + seed data + TTLs.
mode=private: VPC-internal collector + admin-only auth + no seed, no TTL expiry.

Wiring order: Network -> Storage -> Graph/Intake/Compute ->
              Orchestration -> Api -> Frontend.
"""
import os

import aws_cdk as cdk

from stacks.api import Api
from stacks.compute import Compute
from stacks.frontend import Frontend
from stacks.graph import Graph
from stacks.intake import Intake
from stacks.network import Network
from stacks.orchestration import Orchestration
from stacks.storage import Storage

app = cdk.App()
mode = app.node.try_get_context("mode") or "demo"
if mode not in ("demo", "private"):
    raise ValueError(f"mode must be demo|private, got {mode!r}")

stack = cdk.Stack(
    app,
    "AgentGarage",
    env={
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "region": os.environ.get("CDK_DEFAULT_REGION"),
    },
)

network = Network(stack, "Network", mode=mode)
storage = Storage(stack, "Storage", mode=mode)
graph = Graph(stack, "Graph", mode=mode, network=network, storage=storage)
intake = Intake(stack, "Intake", mode=mode, network=network, storage=storage)
compute = Compute(
    stack, "Compute", mode=mode, network=network, storage=storage, graph=graph
)
orchestration = Orchestration(
    stack,
    "Orchestration",
    mode=mode,
    compute=compute,
    storage=storage,
    network=network,
)
api = Api(
    stack,
    "Api",
    mode=mode,
    storage=storage,
    graph=graph,
    orchestration=orchestration,
    compute=compute,
)
frontend = Frontend(stack, "Frontend", mode=mode, api=api)

cdk.CfnOutput(stack, "DashboardUrl", value=frontend.url)
cdk.CfnOutput(stack, "ApiUrl", value=api.url)
cdk.CfnOutput(stack, "CollectorEndpoint", value=intake.collector_url)
cdk.CfnOutput(
    stack, "CollectorSecretArn", value=storage.collector_secret.secret_arn
)
cdk.CfnOutput(stack, "NeptuneEndpoint", value=graph.cluster_endpoint)
cdk.CfnOutput(stack, "KinesisStream", value=intake.stream.stream_name)
cdk.CfnOutput(stack, "BedrockModelId", value=compute.bedrock_model_id)
cdk.CfnOutput(stack, "UserPoolId", value=api.auth_pool.user_pool_id)
cdk.CfnOutput(stack, "UserPoolClientId", value=frontend.client.user_pool_client_id)

app.synth()
