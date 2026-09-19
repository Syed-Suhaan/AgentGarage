import boto3

ec2_regions = ["ap-south-2", "ap-south-1"]


def lambda_handler(event, context):
    stopped = []
    for region in ec2_regions:
        ec2 = boto3.client("ec2", region_name=region)
        pages = ec2.get_paginator("describe_instances").paginate(
            Filters=[
                {"Name": "tag:Project", "Values": ["AgentGarage"]},
                {
                    "Name": "instance-state-name",
                    "Values": ["pending", "running"],
                },
            ]
        )
        ids = [
            i["InstanceId"]
            for page in pages
            for r in page["Reservations"]
            for i in r["Instances"]
        ]
        if ids:
            ec2.stop_instances(InstanceIds=ids)
            stopped.append({"region": region, "instances": ids})
    return {"stopped": stopped}
