"""OpenSearch domain + state graph index. Body lands tomorrow."""
import aws_cdk as cdk


class Search(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, network, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        self.domain = None
