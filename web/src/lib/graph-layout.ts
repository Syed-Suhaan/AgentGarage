import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";
import type { AgentGraph } from "./types";
import { getStatusColor } from "./status-colors";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

export function layoutGraph(
  graph: AgentGraph,
  direction: "TB" | "LR" = "TB"
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  graph.nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  graph.edges.forEach((edge, i) => {
    g.setEdge(edge.from, edge.to, { id: `e-${i}` });
  });

  dagre.layout(g);

  const nodes: Node[] = graph.nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      id: node.id,
      type: "stateNode",
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
      data: { label: node.label },
    };
  });

  const edges: Edge[] = graph.edges.map((edge, i) => ({
    id: `e-${i}`,
    source: edge.from,
    target: edge.to,
    type: "actionEdge",
    data: {
      action: edge.action,
      kind: edge.kind,
      source: edge.source,
    },
    style: { stroke: getStatusColor(edge.kind) },
    animated: edge.kind === "predicted",
  }));

  return { nodes, edges };
}
