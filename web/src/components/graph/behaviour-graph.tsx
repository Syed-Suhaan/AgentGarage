"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { StateNode } from "./state-node";
import { ActionEdge } from "./action-edge";
import { GraphLegend } from "./graph-legend";
import { GraphToolbar } from "./graph-controls";
import { NodeDetailPanel } from "./node-detail-panel";
import { layoutGraph } from "@/lib/graph-layout";
import type { AgentGraph } from "@/lib/types";

const nodeTypes: NodeTypes = { stateNode: StateNode };
const edgeTypes: EdgeTypes = { actionEdge: ActionEdge };

interface BehaviourGraphInnerProps {
  graph: AgentGraph;
}

function BehaviourGraphInner({ graph }: BehaviourGraphInnerProps) {
  const [direction, setDirection] = useState<"TB" | "LR">("TB");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { fitView, getNodes, getEdges } = useReactFlow();

  const { nodes, edges } = useMemo(
    () => layoutGraph(graph, direction),
    [graph, direction]
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [direction]);

  const handleDirectionChange = useCallback(
    (dir: "TB" | "LR") => {
      setIsLoaded(false);
      setDirection(dir);
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 500 });
        setTimeout(() => setIsLoaded(true), 300);
      }, 50);
    },
    [fitView]
  );

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 500 });
  }, [fitView]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const nodeVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: i * 0.05,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  const edgeVariants = {
    hidden: { opacity: 0, pathLength: 0 },
    visible: (i: number) => ({
      opacity: 1,
      pathLength: 1,
      transition: {
        duration: 0.6,
        delay: 0.2 + i * 0.03,
        ease: "easeOut",
      },
    }),
  };

  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="wait">
        <ReactFlow
          key={direction}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={2}
          onLoad={() => setIsLoaded(true)}
        >
          <Background color="#27272a" gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor="#3f3f46"
            maskColor="rgba(0, 0, 0, 0.7)"
            pannable
            zoomable
          />
        </ReactFlow>
      </AnimatePresence>

      <GraphLegend />
      <GraphToolbar
        direction={direction}
        onDirectionChange={handleDirectionChange}
        onFitView={handleFitView}
      />

      {selectedNode && (
        <NodeDetailPanel
          nodeId={selectedNode}
          edges={graph.edges}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

export function BehaviourGraph({ graph }: { graph: AgentGraph }) {
  return (
    <ReactFlowProvider>
      <BehaviourGraphInner graph={graph} />
    </ReactFlowProvider>
  );
}
