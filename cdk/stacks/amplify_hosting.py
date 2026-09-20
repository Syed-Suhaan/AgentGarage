"""Amplify Hosting in us-east-1 (Amplify is unavailable in ap-south-2).

Creates an Amplify app for the static Next.js export under web/.
Connect the GitHub repo via CLI or console if auto-build is needed;
manual zip deploys work immediately via scripts/deploy_amplify.py.
"""
import os

import aws_cdk as cdk
from aws_cdk import aws_amplify as amplify


class AmplifyHosting(cdk.Stack):
    def __init__(
        self,
        scope,
        id,
        *,
        api_url: str,
        user_pool_id: str,
        user_pool_client_id: str,
        cognito_region: str = "ap-south-2",
        **kwargs,
    ):
        super().__init__(scope, id, **kwargs)

        env_vars = [
            amplify.CfnApp.EnvironmentVariableProperty(
                name="NEXT_PUBLIC_API_URL", value=api_url
            ),
            amplify.CfnApp.EnvironmentVariableProperty(
                name="NEXT_PUBLIC_COGNITO_USER_POOL_ID", value=user_pool_id
            ),
            amplify.CfnApp.EnvironmentVariableProperty(
                name="NEXT_PUBLIC_COGNITO_CLIENT_ID", value=user_pool_client_id
            ),
            amplify.CfnApp.EnvironmentVariableProperty(
                name="NEXT_PUBLIC_AWS_REGION", value=cognito_region
            ),
            amplify.CfnApp.EnvironmentVariableProperty(
                name="AMPLIFY_MONOREPO_APP_ROOT", value="web"
            ),
        ]

        # No repository here — avoids baking a GitHub token into the template.
        # Wire GitHub in console or: aws amplify update-app --repository ... --access-token ...
        self.app = amplify.CfnApp(
            self,
            "App",
            name="AgentGarage",
            platform="WEB",
            environment_variables=env_vars,
            custom_rules=[
                amplify.CfnApp.CustomRuleProperty(
                    source="/<*>",
                    target="/index.html",
                    status="404-200",
                )
            ],
        )

        self.branch = amplify.CfnBranch(
            self,
            "Main",
            app_id=self.app.attr_app_id,
            branch_name="main",
            enable_auto_build=False,
            stage="PRODUCTION",
            framework="Next.js - SSG",
        )

        self.url = f"https://main.{self.app.attr_default_domain}"
        cdk.CfnOutput(self, "DashboardUrl", value=self.url)
        cdk.CfnOutput(self, "AmplifyAppId", value=self.app.attr_app_id)
        cdk.CfnOutput(self, "AmplifyDefaultDomain", value=self.app.attr_default_domain)
