#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for AgentGarage.
# Prepares Python + Node tooling to run the mock API tests and synthesize the CDK app.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Ensuring 'python' resolves to python3 (cdk.json runs 'python app.py')"
if ! command -v python >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq python-is-python3
fi

echo "==> Installing Python dependencies (pytest + CDK libraries)"
sudo pip install --quiet --upgrade pytest -r cdk/requirements.txt

echo "==> Installing the AWS CDK CLI (cdk synth / cdk ls)"
if ! command -v cdk >/dev/null 2>&1; then
  sudo env "PATH=$PATH" npm install -g aws-cdk
fi

echo "==> Toolchain versions"
python --version
cdk --version

echo "==> Install complete"
