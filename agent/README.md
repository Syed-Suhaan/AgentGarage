Autonomous Strands refund agent (Bedrock). Four tools. OTLP to collector.

Env:
  AWS credentials + bedrock model access
  BEDROCK_MODEL_ID (optional)
  AWS_REGION
  OTEL_EXPORTER_OTLP_ENDPOINT (collector URL)

Bug in 1.8.2: retries issue_refund without idempotency_key.
Fixed in later versions: always passes idempotency_key.
