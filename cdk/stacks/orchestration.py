"""Step Functions sandbox sequence + EventBridge rule. Body lands tomorrow."""
import aws_cdk as cdk


class Orchestration(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, compute, storage, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        self.state_machine = None
