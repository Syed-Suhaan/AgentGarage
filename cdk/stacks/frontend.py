"""Amplify dashboard + Cognito user pool.

demo: self-signup on, seeded refund agent.
private: admin-only signup (adminEmail context), no seed, data stays in VPC.
Amplify app serves web/ with API_URL = api.url at deploy time.
"""
import aws_cdk as cdk
from aws_cdk import (
    aws_amplify as amplify,
    aws_cognito as cognito,
)


class Frontend(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, api, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        is_demo = mode == "demo"
        admin_email = scope.node.try_get_context("adminEmail")

        self.pool = api.auth_pool
        if not is_demo and admin_email:
            cognito.CfnUserPoolUser(
                self,
                "AdminUser",
                user_pool_id=self.pool.user_pool_id,
                username=admin_email,
                user_attributes=[
                    cognito.CfnUserPoolUser.AttributeTypeProperty(
                        name="email", value=admin_email
                    ),
                    cognito.CfnUserPoolUser.AttributeTypeProperty(
                        name="email_verified", value="true"
                    ),
                ],
            )

        self.client = cognito.UserPoolClient(
            self, "Client", user_pool=self.pool, generate_secret=False
        )

        api_url = api.url
        self.app = amplify.CfnApp(
            self,
            "Dashboard",
            name=f"agentgarage-{mode}",
            platform="WEB",
            environment_variables=[
                amplify.CfnApp.EnvironmentVariableProperty(
                    name="API_URL", value=api_url
                ),
                amplify.CfnApp.EnvironmentVariableProperty(
                    name="MODE", value=mode
                ),
            ],
        )
        self.branch = amplify.CfnBranch(
            self,
            "Main",
            app_id=self.app.ref,
            branch_name="main",
            enable_auto_build=False,
        )

        self.url = f"https://{self.branch.ref}.{self.app.ref}.amplifyapp.com"
