"""Build web/ and push a manual deployment to Amplify (us-east-1)."""
from __future__ import annotations

import os
import subprocess
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
AMPLIFY_STACK = os.environ.get("AMPLIFY_STACK", "agentgarage-demo-amplify")


def sh(cmd, cwd=None, env=None):
    print("+", " ".join(cmd))
    subprocess.check_call(cmd, cwd=cwd or ROOT, env=env, shell=(os.name == "nt"))


def build():
    env = os.environ.copy()
    # Prefer CI/env; fall back to last-known demo values for local runs only.
    env.setdefault(
        "NEXT_PUBLIC_API_URL",
        "https://1foqaogfqg.execute-api.ap-south-2.amazonaws.com/prod/",
    )
    env.setdefault("NEXT_PUBLIC_COGNITO_USER_POOL_ID", "ap-south-2_ZtABAKCU7")
    env.setdefault("NEXT_PUBLIC_COGNITO_CLIENT_ID", "2fc3ij52vhq8qd82u8dcl3j4k")
    env.setdefault("NEXT_PUBLIC_AWS_REGION", "ap-south-2")
    env.setdefault("NEXT_PUBLIC_DEMO_MODE", "true")
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


def find_distribution_id(hostnames: list[str]) -> str | None:
    """Return the CloudFront distribution id that serves any of the hostnames."""
    cf = boto3.client("cloudfront")
    wanted = {h.lower().rstrip(".") for h in hostnames if h}
    paginator = cf.get_paginator("list_distributions")
    for page in paginator.paginate():
        for dist in page.get("DistributionList", {}).get("Items", []) or []:
            aliases = {
                a.lower().rstrip(".")
                for a in (dist.get("Aliases", {}) or {}).get("Items", []) or []
            }
            domain = (dist.get("DomainName") or "").lower().rstrip(".")
            if wanted & aliases or domain in wanted:
                return dist["Id"]
    return None


def invalidate_cloudfront(hostnames: list[str]) -> None:
    """Purge CDN so HTML with no-cache headers is not stuck behind an old edge object."""
    dist_id = find_distribution_id(hostnames)
    if not dist_id:
        print("cloudfront: no distribution found for", hostnames, "(skip invalidate)")
        return
    cf = boto3.client("cloudfront")
    ref = f"agentgarage-{int(time.time())}"
    result = cf.create_invalidation(
        DistributionId=dist_id,
        InvalidationBatch={
            "Paths": {"Quantity": 1, "Items": ["/*"]},
            "CallerReference": ref,
        },
    )
    inv_id = result["Invalidation"]["Id"]
    print(f"cloudfront: invalidated {dist_id} /* ({inv_id})")


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
    default_domain = app["defaultDomain"]
    url = f"https://main.{default_domain}"
    invalidate_cloudfront([f"main.{default_domain}", default_domain])
    print("DashboardUrl", url)
    return url


def main():
    app_id = APP_ID
    if not app_id:
        cfn = boto3.client("cloudformation", region_name=REGION)
        outs = cfn.describe_stacks(StackName=AMPLIFY_STACK)["Stacks"][0]["Outputs"]
        app_id = next(o["OutputValue"] for o in outs if o["OutputKey"] == "AmplifyAppId")
    build()
    deploy(app_id)


if __name__ == "__main__":
    main()
