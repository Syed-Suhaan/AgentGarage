"""Fargate definitions + EC2 world-model host. Bodies land tomorrow."""
import aws_cdk as cdk


class Compute(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, network, storage, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        self.cluster = None
        self.sandbox_task = None
        self.world_model_host = None
