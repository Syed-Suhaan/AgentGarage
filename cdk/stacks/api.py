"""API Gateway + Cognito + real services/api Lambda for dashboard routes."""
import aws_cdk as cdk
from aws_cdk import (
    aws_apigateway as apigw,
    aws_cognito as cognito,
    aws_iam as iam,
    aws_lambda as _lambda,
)

from backend_asset import backend_code


class Api(cdk.NestedStack):
    def __init__(
        self,
        scope,
        id,
        mode: str,
        storage,
        graph,
        orchestration,
        compute,
        **kwargs,
    ):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        code = backend_code()

        self.auth_pool = cognito.UserPool(
            self,
            "AuthPool",
            self_sign_up_enabled=(mode == "demo"),
            sign_in_aliases=cognito.SignInAliases(username=True, email=True),
            removal_policy=cdk.RemovalPolicy.DESTROY
            if mode == "demo"
            else cdk.RemovalPolicy.RETAIN,
        )
        authorizer = apigw.CognitoUserPoolsAuthorizer(
            self, "Authorizer", cognito_user_pools=[self.auth_pool]
        )

        self.api = apigw.RestApi(
            self,
            "RestApi",
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
            ),
        )

        common_env = {
            "MODE": mode,
            "TRACES_BUCKET": storage.traces_bucket.bucket_name,
            "SANDBOXES_BUCKET": storage.sandbox_logs_bucket.bucket_name,
            "EVALS_BUCKET": storage.evals_bucket.bucket_name,
            "SESSIONS_TABLE": storage.sessions_table.table_name,
            "JOBS_TABLE": storage.jobs_table.table_name,
            "EVALS_TABLE": storage.evals_table.table_name,
            "AGENTS_TABLE": storage.agents_table.table_name,
            "NEPTUNE_ENDPOINT": graph.cluster_endpoint,
            "STATE_MACHINE_ARN": orchestration.state_machine.state_machine_arn,
            "BEDROCK_MODEL_ID": compute.bedrock_model_id,
            "BEDROCK_REGION": cdk.Stack.of(self).region,
        }

        api_fn = _lambda.Function(
            self,
            "ApiFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="services.api.app.lambda_handler",
            code=code,
            timeout=cdk.Duration.seconds(120),
            memory_size=1024,
            environment=common_env,
        )
        storage.traces_bucket.grant_read_write(api_fn)
        storage.sandbox_logs_bucket.grant_read_write(api_fn)
        storage.evals_bucket.grant_read_write(api_fn)
        storage.sessions_table.grant_read_write_data(api_fn)
        storage.jobs_table.grant_read_write_data(api_fn)
        storage.evals_table.grant_read_write_data(api_fn)
        storage.agents_table.grant_read_data(api_fn)
        orchestration.state_machine.grant_start_execution(api_fn)
        api_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
                resources=["*"],
            )
        )
        api_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "neptune-db:connect",
                    "neptune-db:ReadDataViaQuery",
                    "neptune-db:WriteDataViaQuery",
                ],
                resources=["*"],
            )
        )

        query_fn = graph.graph_query_fn
        simulate_fn = compute.simulation_fn

        def _route(resource: apigw.IResource, method: str, fn: _lambda.Function):
            resource.add_method(
                method,
                apigw.LambdaIntegration(fn),
                authorizer=authorizer,
                authorization_type=apigw.AuthorizationType.COGNITO,
            )

        agent = self.api.root.add_resource("agent")
        agent_id = agent.add_resource("{id}")
        _route(agent_id.add_resource("graph"), "GET", query_fn)
        _route(agent_id.add_resource("unexplored"), "GET", query_fn)
        _route(agent_id.add_resource("simulate"), "POST", simulate_fn)

        scenarios = self.api.root.add_resource("scenarios")
        _route(scenarios.add_resource("{id}").add_resource("sandbox"), "POST", api_fn)

        sandboxes = self.api.root.add_resource("sandboxes")
        _route(sandboxes.add_resource("{id}"), "GET", api_fn)

        evals = self.api.root.add_resource("evals")
        _route(evals, "GET", api_fn)
        _route(evals.add_resource("run"), "POST", api_fn)

        demo = self.api.root.add_resource("demo")
        _route(demo.add_resource("seed"), "POST", api_fn)

        self.url = self.api.url
