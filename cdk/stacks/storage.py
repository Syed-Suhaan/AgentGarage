"""S3 buckets, DynamoDB tables, KMS key. Bodies land tomorrow."""
import aws_cdk as cdk


class Storage(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        # traces, sandboxes, evals buckets; sessions, jobs, evals, agents tables
