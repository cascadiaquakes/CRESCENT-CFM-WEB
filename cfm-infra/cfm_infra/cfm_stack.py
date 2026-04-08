from aws_cdk import (
    Stack,
    RemovalPolicy,
    CfnOutput,
    Duration,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_apprunner_alpha as apprunner,
)
from constructs import Construct


class CfmStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # ── ECR Repository (existing, created outside stack) ────
        repository = ecr.Repository.from_repository_name(
            self,
            "CfmWebRepo",
            repository_name="cfm-web",
        )

        # ── App Runner Access Role (pulls from ECR) ─────────────
        access_role = iam.Role(
            self,
            "AppRunnerAccessRole",
            assumed_by=iam.ServicePrincipal("build.apprunner.amazonaws.com"),
            description="Allows App Runner to pull images from ECR",
        )
        repository.grant_pull(access_role)

        # ── App Runner Instance Role (runtime permissions) ──────
        instance_role = iam.Role(
            self,
            "AppRunnerInstanceRole",
            assumed_by=iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
            description="Runtime role for CFM App Runner service",
        )

        # ── App Runner Service (Dev) ────────────────────────────
        # CESIUM_KEYS env var is injected at deploy time via
        # GitHub Actions secret — not stored in CDK/CloudFormation
        dev_service = apprunner.Service(
            self,
            "CfmDevService",
            service_name="cfm-web-dev",
            source=apprunner.Source.from_ecr(
                repository=repository,
                image_configuration=apprunner.ImageConfiguration(
                    port=80,
                    environment_variables={
                        "ENV": "dev",
                    },
                ),
                tag_or_digest="dev",
            ),
            access_role=access_role,
            instance_role=instance_role,
            cpu=apprunner.Cpu.ONE_VCPU,
            memory=apprunner.Memory.TWO_GB,
            auto_deployments_enabled=False,
            health_check=apprunner.HealthCheck.http(
                path="/",
                interval=Duration.seconds(10),
                timeout=Duration.seconds(5),
                healthy_threshold=1,
                unhealthy_threshold=5,
            ),
        )

        # ── App Runner Service (Prod) ───────────────────────────
        prod_service = apprunner.Service(
            self,
            "CfmProdService",
            service_name="cfm-web-prod",
            source=apprunner.Source.from_ecr(
                repository=repository,
                image_configuration=apprunner.ImageConfiguration(
                    port=80,
                    environment_variables={
                        "ENV": "prod",
                    },
                ),
                tag_or_digest="prod",
            ),
            access_role=access_role,
            instance_role=instance_role,
            cpu=apprunner.Cpu.ONE_VCPU,
            memory=apprunner.Memory.TWO_GB,
            auto_deployments_enabled=False,
            health_check=apprunner.HealthCheck.http(
                path="/",
                interval=Duration.seconds(10),
                timeout=Duration.seconds(5),
                healthy_threshold=1,
                unhealthy_threshold=5,
            ),
        )

        # ── Outputs ─────────────────────────────────────────────
        CfnOutput(
            self,
            "EcrRepoUri",
            value=repository.repository_uri,
            description="ECR repository URI for CFM web images",
        )

        CfnOutput(
            self,
            "DevServiceUrl",
            value=dev_service.service_url,
            description="App Runner dev service URL",
        )

        CfnOutput(
            self,
            "DevServiceArn",
            value=dev_service.service_arn,
            description="App Runner dev service ARN (needed for deploy workflow)",
        )

        CfnOutput(
            self,
            "ProdServiceUrl",
            value=prod_service.service_url,
            description="App Runner prod service URL",
        )

        CfnOutput(
            self,
            "ProdServiceArn",
            value=prod_service.service_arn,
            description="App Runner prod service ARN (needed for deploy workflow)",
        )