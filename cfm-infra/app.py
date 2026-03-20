#!/usr/bin/env python3
import aws_cdk as cdk
from cfm_infra.cfm_stack import CfmStack

app = cdk.App()

CfmStack(
    app,
    "CfmStack",
    env=cdk.Environment(account="818214664804", region="us-west-2"),
)

app.synth()