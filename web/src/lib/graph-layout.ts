import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";
import type { AgentGraph } from "./types";
import { AGENTGARAGE_NODES, AGENTGARAGE_EDGES } from "./graph-reference-data";

const NODE_DIAMETER = 110;

export function layoutGraph(
  graph?: AgentGraph,
  layoutMode: "force" | "LR" | "TB" = "force"
): { nodes: Node[]; edges: Edge[] } {
  // If custom graph with nodes is provided (e.g. unit tests or specific agent graph)
  if (graph && graph.nodes && graph.nodes.length > 0) {
    const rankdir = layoutMode === "force" ? "LR" : layoutMode;
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir, nodesep: 70, ranksep: 100 });

    graph.nodes.forEach((node) => {
      g.setNode(node.id, { width: NODE_DIAMETER, height: NODE_DIAMETER });
    });

    graph.edges.forEach((edge, i) => {
      g.setEdge(edge.from, edge.to, { id: `e-${i}` });
    });

    dagre.layout(g);

    const nodes: Node[] = graph.nodes.map((node) => {
      const pos = g.node(node.id);
      const meta = AGENTGARAGE_NODES[node.id];
      return {
        id: node.id,
        type: "stateNode",
        position: {
          x: (pos?.x ?? 0) - NODE_DIAMETER / 2,
          y: (pos?.y ?? 0) - NODE_DIAMETER / 2,
        },
        data: (meta || { label: node.label, id: node.id, runs: 100, iconName: "Database", stateId: `S_${node.id.toUpperCase()}` }) as unknown as Record<string, unknown>,
      };
    });

    const edges: Edge[] = graph.edges.map((edge, i) => ({
      id: `e-${i}`,
      source: edge.from,
      target: edge.to,
      type: "actionEdge",
      animated: edge.kind === "predicted",
      data: {
        action: edge.action,
        kind: edge.kind,
        source: edge.source,
      },
    }));

    return { nodes, edges };
  }

  // Default AgentGarage full reference layout
  const nodeEntries = Object.values(AGENTGARAGE_NODES);

  if (layoutMode === "force") {
    // Exact organic visual arrangement matching the reference screenshot
    const nodes: Node[] = nodeEntries.map((node) => ({
      id: node.id,
      type: "stateNode",
      position: {
        x: node.position.x * 1.6,
        y: node.position.y * 1.15,
      },
      data: node as unknown as Record<string, unknown>,
    }));

    const edges: Edge[] = AGENTGARAGE_EDGES.map((edge) => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: "actionEdge",
      animated: edge.kind === "predicted",
      data: {
        action: edge.action,
        kind: edge.kind,
        runs: edge.runs,
        percent: edge.percent,
      },
    }));

    return { nodes, edges };
  }

  // Hierarchical layout with dagre (LR or TB)
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: layoutMode, nodesep: 70, ranksep: 120 });

  nodeEntries.forEach((node) => {
    g.setNode(node.id, { width: NODE_DIAMETER, height: NODE_DIAMETER });
  });

  AGENTGARAGE_EDGES.forEach((edge) => {
    g.setEdge(edge.from, edge.to);
  });

  dagre.layout(g);

  const nodes: Node[] = nodeEntries.map((node) => {
    const pos = g.node(node.id);
    return {
      id: node.id,
      type: "stateNode",
      position: {
        x: (pos?.x ?? 0) - NODE_DIAMETER / 2,
        y: (pos?.y ?? 0) - NODE_DIAMETER / 2,
      },
      data: node as unknown as Record<string, unknown>,
    };
  });

  const edges: Edge[] = AGENTGARAGE_EDGES.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    type: "actionEdge",
    animated: edge.kind === "predicted",
    data: {
      action: edge.action,
      kind: edge.kind,
      runs: edge.runs,
      percent: edge.percent,
    },
  }));

  return { nodes, edges };
}
