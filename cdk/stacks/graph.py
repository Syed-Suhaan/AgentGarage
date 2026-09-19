"""Neptune Serverless property graph + query/builder Lambdas.

Vertices: state. Edges: action with agent_id, status, count.
Query Lambda serves GET /agent/{id}/graph + /unexplored.
Builder Lambda runs on S3 trace arrival and writes edges.
"""
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_neptune as neptune,
)

QUERY_CODE = """import json
def handler(event, context):
    return {"statusCode": 200, "body": json.dumps({"nodes": [], "edges": []})}
"""

BUILDER_CODE = """def handler(event, context):
    return {"ok": True}
"""


class Graph(cdk.NestedStack):
    def __init__(self, scope, id, mode: str, network, storage=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.mode = mode
        is_demo = mode == "demo"

        self.subnet_group = neptune.CfnDBSubnetGroup(
            self,
            "SubnetGroup",
            db_subnet_group_description=f"AgentGarage {mode} neptune subnets",
            subnet_ids=[
                s.subnet_id for s in network.vpc.private_subnets
            ],
        )

        self.cluster = neptune.CfnDBCluster(
            self,
            "Cluster",
            storage_encrypted=True,
            kms_key_id=storage.key.key_arn if storage is not None else None,
            db_subnet_group_name=self.subnet_group.ref,
            vpc_security_group_ids=[network.neptune_sg.security_group_id],
            iam_auth_enabled=True,
            deletion_protection=not is_demo,
            db_port=8182,
            serverless_scaling_configuration=neptune.CfnDBCluster.ServerlessScalingConfigurationProperty(
                min_capacity=1.0 if is_demo else 2.5,
                max_capacity=128.0 if is_demo else 256.0,
            ),
        )
        self.cluster.add_resource_dependency(self.subnet_group)

        self.instance = neptune.CfnDBInstance(
            self,
            "Instance",
            db_cluster_identifier=self.cluster.ref,
            db_instance_class="db.serverless",
            allow_major_version_upgrade=False,
            auto_minor_version_upgrade=True,
        )
        self.instance.add_resource_dependency(self.cluster)

        self.cluster_endpoint = self.cluster.get_att("Endpoint").to_string()

        self.graph_query_fn = _lambda.Function(
            self,
            "QueryFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(QUERY_CODE),
            vpc=network.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[network.lambda_sg],
            timeout=cdk.Duration.seconds(30),
            memory_size=512,
            environment={
                "MODE": mode,
                "NEPTUNE_ENDPOINT": self.cluster_endpoint,
            },
        )
        self.graph_query_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["neptune-db:connect", "neptune-db:ReadDataViaQuery"],
                resources=["*"],
            )
        )

        self.graph_builder_fn = _lambda.Function(
            self,
            "BuilderFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(BUILDER_CODE),
            vpc=network.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[network.lambda_sg],
            timeout=cdk.Duration.seconds(60),
            memory_size=512,
            environment={
                "MODE": mode,
                "NEPTUNE_ENDPOINT": self.cluster_endpoint,
            },
        )
        self.graph_builder_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["neptune-db:connect", "neptune-db:WriteDataViaQuery"],
                resources=["*"],
            )
        )
        if storage is not None:
            storage.traces_bucket.grant_read(self.graph_builder_fn)
