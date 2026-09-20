Autonomous Strands SRE agent (Bedrock). Five tools. OTLP to collector.

Env:
  AWS credentials + bedrock model access
  BEDROCK_MODEL_ID (optional)
  AWS_REGION
  OTEL_EXPORTER_OTLP_ENDPOINT (collector URL)

Demo service: checkout. Goal: restore checkout safely. No fixed script.

Bug in 1.8.2: retries rollback_deployment after timeout without operation_token
or a deployment-state recheck. Second rollback lands on v1.8.1.

Fixed in later versions: always passes operation_token="rollback-{service}",
rechecks get_deployment_history after timeout, and calls verify_service before
claiming success.
