"""Build web/ and push a manual deployment to Amplify (us-east-1)."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import zipfile
from pathlib import Path

import boto3
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
OUT = WEB / "out"
REGION = os.environ.get("AMPLIFY_REGION", "us-east-1")
APP_ID = os.environ.get("AMPLIFY_APP_ID", "")


def sh(cmd, cwd=None, env=None):
    print("+", " ".join(cmd))
    subprocess.check_call(cmd, cwd=cwd or ROOT, env=env, shell=(os.name == "nt"))


def build():
    env = os.environ.copy()
    env.setdefault(
        "NEXT_PUBLIC_API_URL",
        "https://49r4z8chma.execute-api.ap-south-2.amazonaws.com/prod/",
    )
    env.setdefault("NEXT_PUBLIC_COGNITO_USER_POOL_ID", "ap-south-2_ZtABAKCU7")
    env.setdefault("NEXT_PUBLIC_COGNITO_CLIENT_ID", "2fc3ij52vhq8qd82u8dcl3j4k")
    env.setdefault("NEXT_PUBLIC_AWS_REGION", "ap-south-2")
    env.setdefault("NEXT_PUBLIC_GUEST_USERNAME", "demotest")
    env.setdefault("NEXT_PUBLIC_GUEST_PASSWORD", "DemoTest123!")
    # Prefer existing node_modules when present (faster / avoids PATH issues).
    if (WEB / "node_modules").is_dir():
        sh(["npm", "run", "build"], cwd=WEB, env=env)
    else:
        sh(["npm", "ci"], cwd=WEB, env=env)
        sh(["npm", "run", "build"], cwd=WEB, env=env)
    if not OUT.is_dir():
        raise SystemExit("web/out missing after build")


def zip_out(path: Path):
    if path.exists():
        path.unlink()
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in OUT.rglob("*"):
            if f.is_file():
                zf.write(f, f.relative_to(OUT).as_posix())
    print("zip", path, path.stat().st_size)


def deploy(app_id: str):
    client = boto3.client("amplify", region_name=REGION)
    zip_path = ROOT / "cdk" / "build" / "amplify-web.zip"
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    zip_out(zip_path)

    created = client.create_deployment(appId=app_id, branchName="main")
    job_id = created["jobId"]
    upload_url = created["zipUploadUrl"]
    print("uploading", job_id)
    with open(zip_path, "rb") as f:
        req = urllib.request.Request(
            upload_url, data=f.read(), method="PUT", headers={"Content-Type": "application/zip"}
        )
        with urllib.request.urlopen(req) as resp:
            print("upload", resp.status)

    client.start_deployment(appId=app_id, branchName="main", jobId=job_id)
    for _ in range(60):
        job = client.get_job(appId=app_id, branchName="main", jobId=job_id)["job"]
        status = job["summary"]["status"]
        print("job", job_id, status)
        if status in ("SUCCEED", "FAILED", "CANCELLED"):
            if status != "SUCCEED":
                raise SystemExit(f"deploy {status}")
            break
        time.sleep(5)
    app = client.get_app(appId=app_id)["app"]
    url = f"https://main.{app['defaultDomain']}"
    print("DashboardUrl", url)
    return url


def main():
    app_id = APP_ID
    if not app_id:
        # resolve from CloudFormation
        cfn = boto3.client("cloudformation", region_name=REGION)
        outs = cfn.describe_stacks(StackName="AgentGarageAmplify")["Stacks"][0]["Outputs"]
        app_id = next(o["OutputValue"] for o in outs if o["OutputKey"] == "AmplifyAppId")
    build()
    deploy(app_id)


if __name__ == "__main__":
    main()
