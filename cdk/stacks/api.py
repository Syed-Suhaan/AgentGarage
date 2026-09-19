"""API Gateway + Lambdas for the 8 locked routes.

Routes (schemas/api_routes.json):
  GET  /agent/{id}/graph       -> Neptune query Lambda
  GET  /agent/{id}/unexplored  -> Neptune query Lambda
  POST /agent/{id}/simulate    -> simulation_fn (Bedrock/BYOK)
  POST /scenarios/{id}/sandbox -> Step Functions starter
  GET  /sandboxes/{id}         -> jobs table read
  GET  /evals                  -> evals table read
  POST /evals/run              -> eval runner
  POST /demo/seed              -> seed writer (demo only data path)

Cognito authorizer on all routes. Least-privilege per function.
Mocks in services/api/app.py are replaced incrementally; inline code
below mirrors their response shapes.
"""
import aws_cdk as cdk
from aws_cdk import (
    aws_apigateway as apigw,
    aws_cognito as cognito,
    aws_iam as iam,
    aws_lambda as _lambda,
)

_INLINE = {
    "sandbox_start": (
        "import json,os\ndef handler(e,c):\n"
        " import boto3\n"
        " sm=boto3.client('stepfunctions')\n"
        " sm.start_execution(stateMachineArn=os.environ['STATE_MACHINE_ARN'],"
        " input=json.dumps(e.get('body') or {}))\n"
        " return {'statusCode':200,'body':json.dumps({'sandbox_id':'sb_07','status':'running'})}\n"
    ),
    "sandbox_get": (
        "import json\ndef handler(e,c):\n return {'statusCode':200,'body':json.dumps("
        "{'sandbox_id':'sb_07','status':'verified_fail',"
        "'log_s3':'s3://agentgarage/sandboxes/sb_07/log.jsonl',"
        "'invariants':{'refund_calls':2,'passed':False}})}\n"
    ),
    "evals_list": "import json\ndef handler(e,c):\n return {'statusCode':200,'body':json.dumps({'evals':[]})}\n",
    "evals_run": "import json\ndef handler(e,c):\n return {'statusCode':200,'body':json.dumps({'passed':1,'failed':0})}\n",
    "seed": "import json\ndef handler(e,c):\n n=(e.get('body') or {}).get('runs',5) if isinstance(e.get('body'),dict) else 5\n return {'statusCode':200,'body':json.dumps({'traces_written':n})}\n",
}


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

        def _fn(logical: str, key: str, env: dict | None = None) -> _lambda.Function:
            return _lambda.Function(
                self,
                logical,
                runtime=_lambda.Runtime.PYTHON_3_12,
                handler="index.handler",
                code=_lambda.Code.from_inline(_INLINE[key]),
                timeout=cdk.Duration.seconds(30),
                environment={"MODE": mode, **(env or {})},
            )

        query_fn = graph.graph_query_fn
        simulate_fn = compute.simulation_fn

        sm_arn = orchestration.state_machine.state_machine_arn
        sandbox_start_fn = _fn(
            "SandboxStartFn", "sandbox_start", {"STATE_MACHINE_ARN": sm_arn}
        )
        orchestration.state_machine.grant_start_execution(sandbox_start_fn)

        sandbox_get_fn = _fn("SandboxGetFn", "sandbox_get")
        storage.jobs_table.grant_read_data(sandbox_get_fn)

        evals_list_fn = _fn("EvalsListFn", "evals_list")
        storage.evals_table.grant_read_data(evals_list_fn)
        storage.evals_bucket.grant_read(evals_list_fn)

        evals_run_fn = _fn("EvalsRunFn", "evals_run")
        storage.evals_table.grant_read_data(evals_run_fn)
        storage.sandbox_logs_bucket.grant_read(evals_run_fn)

        seed_fn = _fn(
            "SeedFn",
            "seed",
            {
                "TRACES_BUCKET": storage.traces_bucket.bucket_name,
                "SESSIONS_TABLE": storage.sessions_table.table_name,
            },
        )
        storage.traces_bucket.grant_write(seed_fn)
        storage.sessions_table.grant_write_data(seed_fn)

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
        _route(scenarios.add_resource("{id}").add_resource("sandbox"), "POST", sandbox_start_fn)

        sandboxes = self.api.root.add_resource("sandboxes")
        _route(sandboxes.add_resource("{id}"), "GET", sandbox_get_fn)

        evals = self.api.root.add_resource("evals")
        _route(evals, "GET", evals_list_fn)
        _route(evals.add_resource("run"), "POST", evals_run_fn)

        demo = self.api.root.add_resource("demo")
        _route(demo.add_resource("seed"), "POST", seed_fn)

        self.url = self.api.url
