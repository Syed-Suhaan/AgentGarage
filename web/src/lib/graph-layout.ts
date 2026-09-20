import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";
import type { AgentGraph } from "./types";
import {
  AGENTGARAGE_NODES,
  AGENTGARAGE_EDGES,
  type ReferenceNodeMetadata,
  type ReferenceEdge,
} from "./graph-reference-data";

const NODE_DIAMETER = 112;

export function layoutGraph(
  graph?: AgentGraph,
  layoutMode: "force" | "LR" | "TB" = "force",
  activeNodes: Record<string, ReferenceNodeMetadata> = AGENTGARAGE_NODES,
  activeEdges: ReferenceEdge[] = AGENTGARAGE_EDGES
): { nodes: Node[]; edges: Edge[] } {
  // If a custom graph is passed with explicit nodes and layoutMode is hierarchical (LR / TB)
  if (graph && graph.nodes && graph.nodes.length > 0 && (layoutMode === "LR" || layoutMode === "TB")) {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: layoutMode, nodesep: 70, ranksep: 100 });

    graph.nodes.forEach((node) => {
      g.setNode(node.id, { width: NODE_DIAMETER, height: NODE_DIAMETER });
    });

    graph.edges.forEach((edge, i) => {
      g.setEdge(edge.from, edge.to, { id: `e-${i}` });
    });

    dagre.layout(g);

    const nodes: Node[] = graph.nodes.map((node) => {
      const pos = g.node(node.id);
      const meta = activeNodes[node.id];
      return {
        id: node.id,
        type: "stateNode",
        position: {
          x: (pos?.x ?? 0) - NODE_DIAMETER / 2,
          y: (pos?.y ?? 0) - NODE_DIAMETER / 2,
        },
        data: (meta || {
          label: node.label,
          id: node.id,
          runs: 48,
          iconName: "Database",
          stateId: `S_${node.id.toUpperCase()}`,
        }) as unknown as Record<string, unknown>,
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

  // If hierarchical layout mode (LR or TB) without custom graph
  if (layoutMode === "LR" || layoutMode === "TB") {
    const nodeEntries = Object.values(activeNodes);
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: layoutMode, nodesep: 70, ranksep: 120 });

    nodeEntries.forEach((node) => {
      g.setNode(node.id, { width: NODE_DIAMETER, height: NODE_DIAMETER });
    });

    activeEdges.forEach((edge) => {
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

    const edges: Edge[] = activeEdges.map((edge) => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
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

  // Force-Directed Mode: Always use Curated Spacious 2D Arrangement matching Reference Mockup
  const nodeEntries = Object.values(activeNodes);

  const nodes: Node[] = nodeEntries.map((node) => ({
    id: node.id,
    type: "stateNode",
    position: {
      x: node.position.x,
      y: node.position.y,
    },
    data: node as unknown as Record<string, unknown>,
  }));

  const edges: Edge[] = activeEdges.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
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
