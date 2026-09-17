"""Gateway + Lambda handlers from services/api. Body lands tomorrow."""
import aws_cdk as cdk


class Api(cdk.NestedStack):
    def __init__(
        self, scope, id, mode: str, storage, search, orchestration, **kwargs
    ):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        self.url = None
