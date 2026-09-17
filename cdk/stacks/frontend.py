"""Amplify app + Cognito pool. Body lands tomorrow."""
import aws_cdk as cdk


class Frontend(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, api, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        self.url = None
