"""S3 buckets, DynamoDB tables, KMS key, Secrets Manager entries.

Buckets: traces, sandbox-logs, evals (versioned, block-public).
  demo: 1-day expiry. private: no expiry + RETAIN (deletion protection).
Tables: sessions, jobs, evals, agents (on-demand).
  TTL only in demo for sessions/jobs. agents gains BYOK fields.
Secrets: collector key, demo creds (demo only).
"""
import aws_cdk as cdk
from aws_cdk import (
    RemovalPolicy,
    aws_dynamodb as ddb,
    aws_kms as kms,
    aws_s3 as s3,
    aws_secretsmanager as secrets,
)


class Storage(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        is_demo = mode == "demo"

        self.key = kms.Key(
            self,
            "Key",
            enable_key_rotation=True,
            description=f"AgentGarage {mode} data key",
            removal_policy=RemovalPolicy.DESTROY if is_demo else RemovalPolicy.RETAIN,
        )

        def _bucket(logical: str) -> s3.Bucket:
            return s3.Bucket(
                self,
                logical,
                encryption=s3.BucketEncryption.KMS,
                encryption_key=self.key,
                versioned=True,
                block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
                event_bridge_enabled=True,
                lifecycle_rules=[s3.LifecycleRule(expiration=cdk.Duration.days(1))]
                if is_demo
                else None,
                removal_policy=RemovalPolicy.DESTROY if is_demo else RemovalPolicy.RETAIN,
                auto_delete_objects=is_demo,
            )

        self.traces_bucket = _bucket("TracesBucket")
        self.sandbox_logs_bucket = _bucket("SandboxLogsBucket")
        self.evals_bucket = _bucket("EvalsBucket")

        def _table(
            logical: str, partition: str, sort: str | None = None, ttl: bool = False
        ) -> ddb.Table:
            return ddb.Table(
                self,
                logical,
                partition_key=ddb.Attribute(name=partition, type=ddb.AttributeType.STRING),
                billing_mode=ddb.BillingMode.PAY_PER_REQUEST,
                encryption=ddb.TableEncryption.CUSTOMER_MANAGED,
                encryption_key=self.key,
                removal_policy=RemovalPolicy.DESTROY if is_demo else RemovalPolicy.RETAIN,
                point_in_time_recovery_specification=ddb.PointInTimeRecoverySpecification(
                    point_in_time_recovery_enabled=not is_demo
                ),
                **({"sort_key": ddb.Attribute(name=sort, type=ddb.AttributeType.STRING)} if sort else {}),
                **({"time_to_live_attribute": "expires_at"} if ttl else {}),
            )

        self.sessions_table = _table("SessionsTable", "session_id", ttl=is_demo)
        self.jobs_table = _table("JobsTable", "job_id", ttl=is_demo)
        self.evals_table = _table("EvalsTable", "eval_id")
        # agents carries BYOK override fields: model_endpoint,
        # model_secret_arn, image_uri (documented attributes, schemaless).
        self.agents_table = _table("AgentsTable", "agent_id")

        self.collector_secret = secrets.Secret(
            self,
            "CollectorKey",
            description="Collector API key (OTLP ingest)",
            generate_secret_string=secrets.SecretStringGenerator(
                secret_string_template='{"api_key":""}',
                generate_string_key="api_key",
                exclude_punctuation=True,
            ),
            encryption_key=self.key,
            removal_policy=RemovalPolicy.DESTROY
            if is_demo
            else RemovalPolicy.RETAIN,
        )

        self.demo_creds = (
            secrets.Secret(
                self,
                "DemoCreds",
                description="Seeded demo credentials",
                generate_secret_string=secrets.SecretStringGenerator(
                    secret_string_template='{"username":"demo"}',
                    generate_string_key="password",
                    exclude_punctuation=True,
                ),
                encryption_key=self.key,
                removal_policy=RemovalPolicy.DESTROY,
            )
            if is_demo
            else None
        )
