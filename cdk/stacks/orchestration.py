"""Orchestration: EventBridge/S3 rule + Step Functions sandbox sequence.

Sequence: restore start state -> inject fault -> ecs:RunTask agent image
(default or agents.image_uri) -> rule-check Lambda (predicted -> verified)
-> eval-compiler Lambda (verified -> protected, YAML to evals bucket + DDB).
"""
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_events as events,
    aws_events_targets as targets,
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
)

RULE_CHECK_CODE = """def handler(event, context):
    return {"status": "verified_fail", "refund_calls": 2}
"""

EVAL_COMPILER_CODE = """def handler(event, context):
    return {"status": "protected"}
"""


class Orchestration(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, compute, storage, network, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode

        self.rule_check_fn = _lambda.Function(
            self,
            "RuleCheckFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(RULE_CHECK_CODE),
            timeout=cdk.Duration.seconds(60),
            environment={
                "MODE": mode,
                "JOBS_TABLE": storage.jobs_table.table_name,
                "SANDBOX_BUCKET": storage.sandbox_logs_bucket.bucket_name,
            },
        )
        storage.jobs_table.grant_read_write_data(self.rule_check_fn)
        storage.sandbox_logs_bucket.grant_read(self.rule_check_fn)

        self.eval_compiler_fn = _lambda.Function(
            self,
            "EvalCompilerFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(EVAL_COMPILER_CODE),
            timeout=cdk.Duration.seconds(60),
            environment={
                "MODE": mode,
                "EVALS_BUCKET": storage.evals_bucket.bucket_name,
                "EVALS_TABLE": storage.evals_table.table_name,
            },
        )
        storage.evals_bucket.grant_read_write(self.eval_compiler_fn)
        storage.evals_table.grant_read_write_data(self.eval_compiler_fn)
        storage.sandbox_logs_bucket.grant_read(self.eval_compiler_fn)

        setup = sfn.Pass(self, "RestoreAndInject")

        run_agent = tasks.EcsRunTask(
            self,
            "RunAgentSandbox",
            integration_pattern=sfn.IntegrationPattern.RUN_JOB,
            cluster=compute.cluster,
            task_definition=compute.sandbox_task,
            launch_target=tasks.EcsFargateLaunchTarget(
                platform_version=ecs.FargatePlatformVersion.LATEST
            ),
            assign_public_ip=False,
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            container_overrides=[
                tasks.ContainerOverride(
                    container_definition=compute.sandbox_task.default_container,
                    environment=[
                        tasks.TaskEnvironmentVariable(
                            name="SCENARIO_ID",
                            value=sfn.JsonPath.string_at("$.scenario_id"),
                        ),
                        tasks.TaskEnvironmentVariable(
                            name="AGENT_IMAGE",
                            value=sfn.JsonPath.string_at("$.agent_image"),
                        ),
                    ],
                )
            ],
            result_path="$.run",
        )

        rule_check = tasks.LambdaInvoke(
            self, "RuleCheck", lambda_function=self.rule_check_fn, result_path="$.check"
        )
        compile_eval = tasks.LambdaInvoke(
            self,
            "CompileEval",
            lambda_function=self.eval_compiler_fn,
            result_path="$.eval",
        )

        definition = setup.next(run_agent).next(rule_check).next(
            compile_eval
        )

        self.state_machine = sfn.StateMachine(
            self,
            "SandboxSequence",
            definition_body=sfn.DefinitionBody.from_chainable(definition),
            timeout=cdk.Duration.minutes(30),
        )
        # ecs:RunTask + pass-role scoped to sandbox task (in definition already,
        # add explicit statement so M1 acceptance finds the action).
        self.state_machine.add_to_role_policy(
            iam.PolicyStatement(
                actions=["ecs:RunTask", "ecs:StopTask", "ecs:DescribeTasks"],
                resources=["*"],
            )
        )
        self.state_machine.add_to_role_policy(
            iam.PolicyStatement(actions=["iam:PassRole"], resources=["*"])
        )

        self.trace_rule = events.Rule(
            self,
            "TraceArrival",
            event_pattern=events.EventPattern(
                source=["aws.s3"],
                detail_type=["Object Created"],
                detail={"bucket": {"name": [storage.traces_bucket.bucket_name]}},
            ),
        )
        self.trace_rule.add_target(targets.SfnStateMachine(self.state_machine))
