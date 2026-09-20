"""AgentGarage CDK entry. One codebase, two modes.

mode=demo:    public collector + self-signup + seed data + TTLs.
mode=private: VPC-internal collector + admin-only auth + no seed, no TTL expiry.

Wiring order: Network -> Storage -> Graph/Intake/Compute ->
              Orchestration -> Api -> Frontend (Cognito).
Amplify Hosting is a separate stack in us-east-1 (Amplify missing in ap-south-2).
"""
import os

import aws_cdk as cdk

from stacks.amplify_hosting import AmplifyHosting
from stacks.api import Api
from stacks.agentcore import AgentCore
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

account = os.environ.get("CDK_DEFAULT_ACCOUNT")
backend_region = os.environ.get("CDK_DEFAULT_REGION") or "ap-south-2"
amplify_region = app.node.try_get_context("amplifyRegion") or "us-east-1"

stack = cdk.Stack(
    app,
    "AgentGarage",
    env={"account": account, "region": backend_region},
)

network = Network(stack, "Network", mode=mode)
storage = Storage(stack, "Storage", mode=mode)
graph = Graph(stack, "Graph", mode=mode, network=network, storage=storage)
intake = Intake(stack, "Intake", mode=mode, network=network, storage=storage)
compute = Compute(
    stack, "Compute", mode=mode, network=network, storage=storage, graph=graph
)
agentcore = AgentCore(
    stack, "AgentCore", mode=mode, network=network, storage=storage
)
orchestration = Orchestration(
    stack,
    "Orchestration",
    mode=mode,
    compute=compute,
    storage=storage,
    network=network,
    agentcore=agentcore,
)
api = Api(
    stack,
    "Api",
    mode=mode,
    storage=storage,
    graph=graph,
    orchestration=orchestration,
    compute=compute,
    agentcore=agentcore,
)
frontend = Frontend(stack, "Frontend", mode=mode, api=api)

# Amplify is not available in every region (e.g. ap-south-2). Host dashboard in us-east-1.
# Cross-region: pass concrete API/Cognito IDs (no CFN cross-region tokens).
api_url = app.node.try_get_context("apiUrl") or os.environ.get("API_URL")
user_pool_id = app.node.try_get_context("userPoolId") or os.environ.get("USER_POOL_ID")
user_pool_client_id = (
    app.node.try_get_context("userPoolClientId") or os.environ.get("USER_POOL_CLIENT_ID")
)

if api_url and user_pool_id and user_pool_client_id:
    amplify_stack = AmplifyHosting(
        app,
        "AgentGarageAmplify",
        env={"account": account, "region": amplify_region},
        api_url=api_url,
        user_pool_id=user_pool_id,
        user_pool_client_id=user_pool_client_id,
        cognito_region=backend_region,
    )
    cdk.CfnOutput(amplify_stack, "BackendApiUrl", value=api_url)

# Backend DashboardUrl stays API until Amplify is deployed; live UI is AgentGarageAmplify.DashboardUrl
cdk.CfnOutput(stack, "DashboardUrl", value=api.url)
cdk.CfnOutput(stack, "ApiUrl", value=api.url)
cdk.CfnOutput(stack, "CollectorEndpoint", value=intake.collector_url)
cdk.CfnOutput(
    stack, "CollectorSecretArn", value=storage.collector_secret.secret_arn
)
cdk.CfnOutput(stack, "NeptuneEndpoint", value=graph.cluster_endpoint)
cdk.CfnOutput(stack, "KinesisStream", value=intake.stream.stream_name)
cdk.CfnOutput(stack, "BedrockModelId", value=compute.bedrock_model_id)
cdk.CfnOutput(stack, "AgentCoreRuntimeArn", value=agentcore.runtime_arn)
cdk.CfnOutput(stack, "UserPoolId", value=api.auth_pool.user_pool_id)
cdk.CfnOutput(stack, "UserPoolClientId", value=frontend.client.user_pool_client_id)

app.synth()
