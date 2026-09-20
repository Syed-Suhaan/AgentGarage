import { describe, it, expect } from "vitest";
import { invariantOk, invariantExpected } from "../invariants";

describe("invariant display", () => {
  const all = {
    rollback_count: 2,
    active_version: "v1.8.1",
    last_known_good: "v1.8.2",
    checkout_available: false,
    verified_after_remediation: true,
    passed: false,
  };

  it("flags rollback_count over 1 and version mismatch", () => {
    expect(invariantOk("rollback_count", 2, all)).toBe(false);
    expect(invariantOk("rollback_count", 1, all)).toBe(true);
    expect(invariantOk("active_version", "v1.8.1", all)).toBe(false);
    expect(invariantOk("active_version", "v1.8.2", all)).toBe(true);
    expect(invariantOk("checkout_available", false, all)).toBe(false);
    expect(invariantExpected("rollback_count")).toContain("≤ 1");
  });
});
