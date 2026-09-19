import { describe, it, expect } from "vitest";
import { statusConfig, getStatusColor, getStatusBg } from "../status-colors";
import type { EdgeKind } from "../types";

describe("statusConfig", () => {
  const kinds: EdgeKind[] = ["observed", "predicted", "verified", "protected"];

  it("defines configuration for all four lifecycle edge kinds", () => {
    kinds.forEach((kind) => {
      expect(statusConfig[kind]).toBeDefined();
      expect(statusConfig[kind].color).toMatch(/^#/);
      expect(statusConfig[kind].label).toBeTruthy();
    });
  });

  it("uses red accent (#ef4444) for verified failures", () => {
    expect(getStatusColor("verified")).toBe("#ef4444");
    expect(getStatusBg("verified")).toContain("red");
  });

  it("uses grey tone (#6b7280) for predicted paths", () => {
    expect(getStatusColor("predicted")).toBe("#6b7280");
  });

  it("uses blue (#3b82f6) for observed paths and amber (#f59e0b) for protected", () => {
    expect(getStatusColor("observed")).toBe("#3b82f6");
    expect(getStatusColor("protected")).toBe("#f59e0b");
  });
});
