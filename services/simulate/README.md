POSTs to WORLD_MODEL_URL or Bedrock. Writes predicted scenarios only.
After each prediction, `services.rank` attaches risk_score (Jev if
TYPESAFE_API_KEY is set, else heuristic) so sandboxes run highest risk first.
