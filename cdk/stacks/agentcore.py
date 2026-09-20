"""AgentCore Runtime: the real sandbox.

Each scenario runs the registered agent container inside a dedicated
Firecracker microVM (isolated CPU/memory/filesystem, sanitized on
termination). VPC mode + private subnets. HTTPS egress is allowed so the
agent can call Bedrock in us-east-1 (Nova is not on-demand in ap-south-2);
ECR/Logs prefer VPC endpoints owned by the Network stack.

No local Docker for synth: this stack references an ECR image URI.
Push the image before deploy (scripts/push_agent_image), or pass
  -c agentImageUri=ACCOUNT.dkr.ecr.REGION.amazonaws.com/your-agent:tag
"""
import aws_cdk as cdk
from aws_cdk import (
    aws_ecr as ecr,
    aws_iam as iam,
)


class AgentCore(cdk.NestedStack):
    def __init__(
        self,
        scope,
        id,
        mode: str,
        network,
        storage,
        bedrock_model_id: str,
        bedrock_region: str,
        **kwargs,
    ):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        self.sandbox_sg = network.sandbox_sg

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
                actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                resources=["*"],
            )
        )
        self.execution_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream",
                    "bedrock:GetInferenceProfile",
                    "bedrock:ListInferenceProfiles",
                ],
                resources=["*"],
            )
        )
        storage.sandbox_logs_bucket.grant_write(self.execution_role)

        override = scope.node.try_get_context("agentImageUri")
        if override:
            self.repo = None
            self.container_uri = str(override)
        else:
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
            self.container_uri = f"{self.repo.repository_uri}:latest"

        self.runtime = cdk.CfnResource(
            self,
            "Runtime",
            type="AWS::BedrockAgentCore::Runtime",
            properties={
                "AgentRuntimeName": f"agentgarage{mode}",
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
                "ProtocolConfiguration": "HTTP",
                "EnvironmentVariables": {
                    "BEDROCK_MODEL_ID": bedrock_model_id,
                    "BEDROCK_REGION": bedrock_region,
                    "AWS_DEFAULT_REGION": bedrock_region,
                },
            },
        )
        # primaryIdentifier is AgentRuntimeId; InvokeAgentRuntime needs the ARN.
        self.runtime_arn = self.runtime.get_att("AgentRuntimeArn").to_string()
