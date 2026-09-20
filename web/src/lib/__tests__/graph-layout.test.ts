import { describe, it, expect } from "vitest";
import { layoutGraph } from "../graph-layout";
import type { AgentGraph } from "../types";

describe("layoutGraph", () => {
  const sampleGraph: AgentGraph = {
    nodes: [
      { id: "health_inspected", label: "health_inspected" },
      { id: "rollback_succeeded", label: "rollback_succeeded" },
      { id: "service_restored", label: "service_restored" },
      { id: "rollback_timeout", label: "rollback_timeout" },
    ],
    edges: [
      {
        from: "health_inspected",
        action: "get_deployment_history",
        to: "rollback_succeeded",
        kind: "observed",
        source: "tr_84f2",
      },
      {
        from: "rollback_succeeded",
        action: "verify_service",
        to: "service_restored",
        kind: "observed",
        source: "tr_84f2",
      },
      {
        from: "rollback_succeeded",
        action: "tool_timeout",
        to: "rollback_timeout",
        kind: "predicted",
        source: "sc_19",
      },
    ],
  };

  it("converts AgentGraph into React Flow positioned nodes and styled edges", () => {
    const { nodes, edges } = layoutGraph(sampleGraph, "TB");

    expect(nodes).toHaveLength(4);
    expect(edges).toHaveLength(3);

    nodes.forEach((node) => {
      expect(node.position).toBeDefined();
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
      expect(node.type).toBe("stateNode");
    });

    const predictedEdge = edges.find((e) => e.data?.kind === "predicted");
    expect(predictedEdge?.animated).toBe(true);

    const observedEdge = edges.find((e) => e.data?.kind === "observed");
    expect(observedEdge?.animated).toBe(false);
  });
});
