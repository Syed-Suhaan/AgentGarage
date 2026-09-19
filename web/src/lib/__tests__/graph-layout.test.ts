import { describe, it, expect } from "vitest";
import { layoutGraph } from "../graph-layout";
import type { AgentGraph } from "../types";

describe("layoutGraph", () => {
  const sampleGraph: AgentGraph = {
    nodes: [
      { id: "customer_verified", label: "customer_verified" },
      { id: "refund_pending", label: "refund_pending" },
      { id: "refund_succeeded", label: "refund_succeeded" },
    ],
    edges: [
      {
        from: "customer_verified",
        action: "get_order",
        to: "refund_pending",
        kind: "observed",
        source: "tr_84f2",
      },
      {
        from: "refund_pending",
        action: "issue_refund",
        to: "refund_succeeded",
        kind: "observed",
        source: "tr_84f2",
      },
      {
        from: "refund_succeeded",
        action: "tool_timeout",
        to: "refund_pending",
        kind: "predicted",
        source: "sc_19",
      },
    ],
  };

  it("converts AgentGraph into React Flow positioned nodes and styled edges", () => {
    const { nodes, edges } = layoutGraph(sampleGraph, "TB");

    expect(nodes).toHaveLength(3);
    expect(edges).toHaveLength(3);

    // Nodes have coordinates calculated by dagre
    nodes.forEach((node) => {
      expect(node.position).toBeDefined();
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
      expect(node.type).toBe("stateNode");
    });

    // Predicted edges are animated
    const predictedEdge = edges.find((e) => e.data?.kind === "predicted");
    expect(predictedEdge?.animated).toBe(true);

    const observedEdge = edges.find((e) => e.data?.kind === "observed");
    expect(observedEdge?.animated).toBe(false);
  });
});
