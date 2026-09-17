import aws_cdk as cdk

from stacks.api import Api
from stacks.compute import Compute
from stacks.frontend import Frontend
from stacks.intake import Intake
from stacks.network import Network
from stacks.orchestration import Orchestration
from stacks.search import Search
from stacks.storage import Storage

app = cdk.App()
mode = app.node.try_get_context("mode") or "demo"

stack = cdk.Stack(app, "AgentGarage", env={
    "account": __import__("os").environ.get("CDK_DEFAULT_ACCOUNT"),
    "region": __import__("os").environ.get("CDK_DEFAULT_REGION"),
})
network = Network(stack, "Network", mode=mode)
storage = Storage(stack, "Storage", mode=mode)
search = Search(stack, "Search", mode=mode, network=network)
intake = Intake(stack, "Intake", mode=mode, network=network, storage=storage)
compute = Compute(stack, "Compute", mode=mode, network=network, storage=storage)
orchestration = Orchestration(
    stack, "Orchestration", mode=mode, compute=compute, storage=storage,
)
api = Api(
    stack, "Api", mode=mode, storage=storage, search=search,
    orchestration=orchestration,
)
Frontend(stack, "Frontend", mode=mode, api=api)

app.synth()
