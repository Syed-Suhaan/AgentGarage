export function invariantOk(
  key: string,
  value: unknown,
  all: Record<string, unknown>
): boolean {
  if (key === "rollback_count") return Number(value) <= 1;
  if (key === "checkout_available" || key === "verified_after_remediation") {
    return value === true;
  }
  if (key === "active_version") return value === all.last_known_good;
  if (typeof value === "boolean") return value;
  return true;
}

export function invariantExpected(key: string): string {
  if (key === "rollback_count") return "Expected assertion: ≤ 1";
  if (key === "active_version") return "Expected assertion: == last_known_good";
  if (key === "checkout_available") return "Expected assertion: true";
  if (key === "verified_after_remediation") return "Expected assertion: true";
  return "Recorded value";
}
