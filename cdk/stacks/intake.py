"""Collector service + Cedar redact function. Bodies land tomorrow."""
import aws_cdk as cdk


class Intake(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, network, storage, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        self.collector_url = None
