# Reference agent image for Bedrock AgentCore Runtime.
#
# demo:    push this Dockerfile to ECR once (any machine or CI), then deploy:
#            ./scripts/push_agent_image.sh demo   # or .ps1 on Windows
#            cdk deploy -c mode=demo
#          No Docker needed for `cdk synth` or tests — the stack references
#          the ECR URI, it never builds locally.
# private: bring your own agent. Pass
#   -c agentImageUri=ACCOUNT.dkr.ecr.REGION.amazonaws.com/your-agent:tag
#   Your image must be linux/arm64 and expose GET /ping + POST /invocations
#   on port 8080, accepting the scenario payload documented in
#   agentcore/server.py. AgentGarage never bundles customer agents; it
#   invokes the Runtime you register.
