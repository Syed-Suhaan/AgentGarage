"""AgentCore Runtime: the real sandbox.

Each scenario runs the registered agent container inside a dedicated
Firecracker microVM (isolated CPU/memory/filesystem, sanitized on
termination). VPC mode = no internet by default; private subnets + VPC
endpoints for ECR/S3/Bedrock.

No local Docker is needed for synth or tests: this stack only references an
ECR image URI. Build + push once (any machine or CI) with
scripts/push_agent_image before deploying:

  demo default: <this-account>.dkr.ecr.<this-region>.amazonaws.com/agentgarage-agent:latest
  private/custom: cdk deploy -c agentImageUri=ACCOUNT.dkr.ecr.REGION.amazonaws.com/your-agent:tag

Your image must expose GET /ping + POST /invocations on :8080 (linux/arm64);
see agentcore/server.py for the scenario payload contract.
"""
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_ecr as ecr,
    aws_iam as iam,
)


class AgentCore(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, network, storage, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode

        # Isolated sandbox SG: no ingress, no egress. Traffic leaves only
        # via VPC endpoints (ECR/S3/Bedrock). No NAT route for these tasks.
        self.sandbox_sg = ec2.SecurityGroup(
            self,
            "SandboxSG",
            vpc=network.vpc,
            description="AgentCore Runtime microVMs: VPC endpoints only",
            allow_all_outbound=False,
        )

        # VPC endpoints so the Runtime pulls images + calls Bedrock without internet.
        for name, service in (
            ("EcrApi", ec2.InterfaceVpcEndpointAwsService.ECR),
            ("EcrDkr", ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER),
            ("BedrockRuntime", ec2.InterfaceVpcEndpointAwsService.BEDROCK_RUNTIME),
            ("Logs", ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS),
        ):
            network.vpc.add_interface_endpoint(
                f"AgentCore{name}",
                service=service,
                subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
                security_groups=[self.sandbox_sg],
            )

        # Execution role assumed by the AgentCore service for this Runtime.
        self.execution_role = iam.Role(
            self,
            "ExecutionRole",
            assumed_by=iam.ServicePrincipal("bedrock-agentcore.amazonaws.com"),
            description=f"AgentGarage {mode} AgentCore Runtime execution role",
        )
        self.execution_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ecr:BatchGetImage",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetAuthorizationToken",
                ],
                resources=["*"],
            )
        )
        self.execution_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=["*"],
            )
        )
        self.execution_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream",
                ],
                resources=["*"],
            )
        )
        storage.sandbox_logs_bucket.grant_write(self.execution_role)

        # Image registry for the reference agent. CDK never builds the image;
        # push it beforehand (scripts/push_agent_image) or pass -c agentImageUri.
        self.repo = ecr.Repository(
            self,
            "AgentRepo",
            repository_name=f"agentgarage-agent-{mode}",
            removal_policy=(
                cdk.RemovalPolicy.DESTROY
                if mode == "demo"
                else cdk.RemovalPolicy.RETAIN
            ),
        )
        override = scope.node.try_get_context("agentImageUri")
        self.container_uri = (
            str(override) if override else f"{self.repo.repository_uri}:latest"
        )

        self.runtime = cdk.CfnResource(
            self,
            "Runtime",
            type="AWS::BedrockAgentCore::Runtime",
            properties={
                "AgentRuntimeName": f"agentgarage-{mode}",
                "AgentRuntimeArtifact": {
                    "ContainerConfiguration": {"ContainerUri": self.container_uri}
                },
                "NetworkConfiguration": {
                    "NetworkMode": "VPC",
                    "NetworkModeConfig": {
                        "Subnets": [
                            s.subnet_id for s in network.vpc.private_subnets
                        ],
                        "SecurityGroups": [self.sandbox_sg.security_group_id],
                    },
                },
                "RoleArn": self.execution_role.role_arn,
            },
        )
        self.runtime_arn = self.runtime.ref
