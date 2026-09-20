"""Orchestration: Step Functions — invoke AgentCore sandbox, then eval compiler."""
import aws_cdk as cdk
from aws_cdk import (
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
)

from backend_asset import backend_code


class Orchestration(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, compute, storage, network, agentcore, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        code = backend_code()

        env = {
            "MODE": mode,
            "JOBS_TABLE": storage.jobs_table.table_name,
            "SANDBOX_BUCKET": storage.sandbox_logs_bucket.bucket_name,
            "SANDBOXES_BUCKET": storage.sandbox_logs_bucket.bucket_name,
            "EVALS_BUCKET": storage.evals_bucket.bucket_name,
            "EVALS_TABLE": storage.evals_table.table_name,
            "TRACES_BUCKET": storage.traces_bucket.bucket_name,
            "SESSIONS_TABLE": storage.sessions_table.table_name,
            "BEDROCK_MODEL_ID": compute.bedrock_model_id,
            "BEDROCK_REGION": compute.bedrock_region,
            "AGENTCORE_RUNTIME_ARN": agentcore.runtime_arn,
            "AGENTCORE_REGION": cdk.Stack.of(self).region,
        }

        # Invokes the agent inside AgentCore Runtime (real microVM), then
        # applies code-level invariants. Agent code never runs in this Lambda.
        self.rule_check_fn = _lambda.Function(
            self,
            "SandboxRunFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="services.replay.app.lambda_handler",
            code=code,
            timeout=cdk.Duration.seconds(300),
            memory_size=2048,
            environment=env,
        )
        storage.jobs_table.grant_read_write_data(self.rule_check_fn)
        storage.sandbox_logs_bucket.grant_read_write(self.rule_check_fn)
        storage.sessions_table.grant_read_data(self.rule_check_fn)
        storage.traces_bucket.grant_read(self.rule_check_fn)
        self.rule_check_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock-agentcore:InvokeAgentRuntime"],
                resources=[agentcore.runtime_arn],
            )
        )

        self.eval_compiler_fn = _lambda.Function(
            self,
            "EvalCompilerFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="services.evals.app.lambda_handler",
            code=code,
            timeout=cdk.Duration.seconds(60),
            environment=env,
        )
        storage.evals_bucket.grant_read_write(self.eval_compiler_fn)
        storage.evals_table.grant_read_write_data(self.eval_compiler_fn)
        storage.sandbox_logs_bucket.grant_read(self.eval_compiler_fn)
        storage.jobs_table.grant_read_write_data(self.eval_compiler_fn)

        run_sandbox = tasks.LambdaInvoke(
            self,
            "RunSandbox",
            lambda_function=self.rule_check_fn,
            payload_response_only=True,
            result_path="$.sandbox",
        )
        compile_eval = tasks.LambdaInvoke(
            self,
            "CompileEval",
            lambda_function=self.eval_compiler_fn,
            payload_response_only=True,
            result_path="$.eval",
        )

        self.state_machine = sfn.StateMachine(
            self,
            "SandboxSequence",
            definition_body=sfn.DefinitionBody.from_chainable(
                run_sandbox.next(compile_eval)
            ),
            timeout=cdk.Duration.minutes(15),
        )
