"""Cognito for API auth. Amplify skipped in regions that lack AWS::Amplify::App."""
import aws_cdk as cdk
from aws_cdk import aws_cognito as cognito


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

        # Amplify (AWS::Amplify::App) is not in every region (e.g. ap-south-2).
        # Dashboard hosting is left to the frontend team / another region.
        self.app_id = "amplify-skipped"
        self.url = api.url
