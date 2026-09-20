# Build + push the reference agent image (linux/arm64) for AgentCore Runtime.
# Run ONCE from any machine with Docker (or CI) BEFORE cdk deploy.
# Usage: .\push_agent_image.ps1 [-Mode demo]
param([string]$Mode = "demo")
$ErrorActionPreference = "Stop"
$Region = $env:CDK_DEFAULT_REGION; if (-not $Region) { $Region = "ap-south-2" }
$Account = $env:CDK_DEFAULT_ACCOUNT; if (-not $Account) { throw "set CDK_DEFAULT_ACCOUNT" }
$Repo = "agentgarage-agent-$Mode"
$Uri = "$Account.dkr.ecr.$Region.amazonaws.com/${Repo}:latest"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if ($PSScriptRoot.EndsWith("scripts")) { $Root = Join-Path $PSScriptRoot ".." }

aws ecr describe-repositories --repository-names $Repo --region $Region 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { aws ecr create-repository --repository-name $Repo --region $Region | Out-Null }

aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$Account.dkr.ecr.$Region.amazonaws.com"
docker buildx build --platform linux/arm64 -t $Uri -f "$Root/agentcore/Dockerfile" $Root --push
Write-Output "pushed $Uri"
