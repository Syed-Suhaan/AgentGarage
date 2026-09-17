"""VPC, subnets, endpoints. Bodies land tomorrow."""
import aws_cdk as cdk


class Network(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        self.vpc = None  # ec2.Vpc: public + private subnets, S3/DDB endpoints
