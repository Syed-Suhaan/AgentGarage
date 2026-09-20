"""VPC, subnets, endpoints, security groups.

demo: public + private subnets, 1 NAT, public collector.
private: same VPC, collector internal, no public ingress to data plane.
"""
import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2


class Network(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode

        self.vpc = ec2.Vpc(
            self,
            "Vpc",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public", subnet_type=ec2.SubnetType.PUBLIC
                ),
                ec2.SubnetConfiguration(
                    name="private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                ),
            ],
        )

        self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3,
        )
        self.vpc.add_gateway_endpoint(
            "DdbEndpoint",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        )

        self.kinesis_endpoint = self.vpc.add_interface_endpoint(
            "KinesisEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.KINESIS_STREAMS,
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )

        self.neptune_sg = ec2.SecurityGroup(
            self,
            "NeptuneSG",
            vpc=self.vpc,
            description="Neptune Serverless ingress from query/builder Lambdas only",
            allow_all_outbound=True,
        )
        self.lambda_sg = ec2.SecurityGroup(
            self,
            "LambdaSG",
            vpc=self.vpc,
            description="VPC-attached Lambdas (graph query/builder, redact)",
            allow_all_outbound=True,
        )
        self.neptune_sg.add_ingress_rule(
            peer=self.lambda_sg,
            connection=ec2.Port.tcp(8182),
            description="Gremlin/openCypher from query/builder Lambdas",
        )

        # AgentCore Runtime microVMs: no ingress. HTTPS egress via NAT for
        # cross-region Bedrock (Nova lives in us-east-1). VPC endpoints for
        # ECR/Logs so image pull + logging stay off the public internet.
        # Endpoints live here (not in AgentCore nested stack) to avoid a
        # Network ↔ AgentCore circular dependency.
        self.sandbox_sg = ec2.SecurityGroup(
            self,
            "SandboxSG",
            vpc=self.vpc,
            description="AgentCore Runtime microVMs: HTTPS egress + VPC endpoints",
            allow_all_outbound=False,
        )
        self.sandbox_sg.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="HTTPS to Bedrock / ECR / Logs",
        )
        for name, service in (
            ("AgentCoreEcrApi", ec2.InterfaceVpcEndpointAwsService.ECR),
            ("AgentCoreEcrDkr", ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER),
            ("AgentCoreLogs", ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS),
        ):
            self.vpc.add_interface_endpoint(
                name,
                service=service,
                subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
                security_groups=[self.sandbox_sg],
            )
