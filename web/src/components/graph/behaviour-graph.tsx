"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Search, ChevronDown, Check } from "lucide-react";
import { StateNode } from "./state-node";
import { ActionEdge } from "./action-edge";
import { GraphLegend } from "./graph-legend";
import { CanvasControls } from "./graph-controls";
import { StateInspector } from "./state-inspector";
import { LinkedTraceDrawer } from "./linked-trace-drawer";
import { layoutGraph } from "@/lib/graph-layout";
import {
  AGENTGARAGE_NODES,
  AGENTGARAGE_TRACE,
  type ReferenceNodeMetadata,
} from "@/lib/graph-reference-data";
import { cn } from "@/lib/utils";
import type { AgentGraph, EdgeKind } from "@/lib/types";

const nodeTypes: NodeTypes = { stateNode: StateNode };
const edgeTypes: EdgeTypes = { actionEdge: ActionEdge };

type FilterKind = "all" | EdgeKind;

interface BehaviourGraphProps {
  graph?: AgentGraph;
}

function BehaviourGraphInner({}: BehaviourGraphProps) {
  const [layoutMode, setLayoutMode] = useState<"force" | "LR" | "TB">("force");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("refund_pending");
  const [filterKind, setFilterKind] = useState<FilterKind>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [timeRange, setTimeRange] = useState("Last 7 days");
  const [agentName, setAgentName] = useState("Customer Support Agent");

  const { fitView, setCenter } = useReactFlow();

  // Compute graph nodes and edges
  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => layoutGraph(undefined, layoutMode),
    [layoutMode]
  );

  // Filter edges based on selected filter pill
  const filteredEdges = useMemo(() => {
    if (filterKind === "all") return rawEdges;
    return rawEdges.filter((e) => {
      const edgeData = e.data as { kind?: EdgeKind };
      if (filterKind === "verified") return edgeData?.kind === "verified";
      return edgeData?.kind === filterKind;
    });
  }, [rawEdges, filterKind]);

  // Highlight selected node and filter by search
  const nodes = useMemo(() => {
    return rawNodes.map((n) => {
      const isSelected = n.id === selectedNodeId;
      const meta = AGENTGARAGE_NODES[n.id];
      const matchesSearch =
        !searchQuery ||
        n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta?.label.toLowerCase().includes(searchQuery.toLowerCase());

      return {
        ...n,
        selected: isSelected,
        style: {
          ...n.style,
          opacity: matchesSearch ? 1 : 0.25,
        },
      };
    });
  }, [rawNodes, selectedNodeId, searchQuery]);

  // Initial fit view
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.12, duration: 600 });
    }, 150);
    return () => clearTimeout(timer);
  }, [layoutMode, fitView]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setIsInspectorOpen(true);
  }, []);

  const handleCenterSelected = useCallback(() => {
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node) {
      setCenter(node.position.x + 55, node.position.y + 55, { zoom: 1.1, duration: 600 });
    } else {
      fitView({ padding: 0.15, duration: 500 });
    }
  }, [nodes, selectedNodeId, setCenter, fitView]);

  const activeNodeMeta: ReferenceNodeMetadata =
    AGENTGARAGE_NODES[selectedNodeId] || AGENTGARAGE_NODES.refund_pending;

  return (
    <div className="flex h-full w-full flex-col bg-[#080808] text-[#f3f3f1] overflow-hidden select-none font-sans">
      {/* Top Filter & Toolbar Bar */}
      <div className="border-b border-[#2a2a28] bg-[#0c0c0b] px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Agent Selector Dropdown */}
          <div className="relative">
            <button className="flex items-center gap-2 rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] px-3 py-1.5 font-mono text-xs text-[#f3f3f1] hover:border-zinc-500 transition-colors">
              <span>{agentName}</span>
              <ChevronDown className="h-3 w-3 text-[#8f8f8d]" />
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="relative">
            <button className="flex items-center gap-2 rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] px-3 py-1.5 font-mono text-xs text-[#8f8f8d] hover:text-[#f3f3f1] hover:border-zinc-500 transition-colors">
              <span>{timeRange}</span>
              <ChevronDown className="h-3 w-3 text-[#8f8f8d]" />
            </button>
          </div>

          {/* Search states or actions */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8f8f8d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search states or actions..."
              className="h-8 w-full rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] pl-8 pr-3 text-xs font-mono text-[#f3f3f1] placeholder:text-[#8f8f8d] focus:border-[#3b76ff] focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Pills & Layout Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Filter Pills with Counts matching screenshot */}
          <div className="flex items-center rounded-xl border border-dashed border-[#2a2a28] bg-[#141413] p-0.5 text-xs font-mono">
            <button
              onClick={() => setFilterKind("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 transition-all",
                filterKind === "all"
                  ? "bg-[#3b76ff] text-white font-semibold shadow-sm"
                  : "text-[#8f8f8d] hover:text-[#f3f3f1]"
              )}
            >
              All 56
            </button>
            <button
              onClick={() => setFilterKind("observed")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all",
                filterKind === "observed"
                  ? "bg-[#3b76ff] text-white font-semibold shadow-sm"
                  : "text-[#8f8f8d] hover:text-[#f3f3f1]"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#3b76ff]" />
              <span>Observed 24</span>
            </button>
            <button
              onClick={() => setFilterKind("predicted")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all",
                filterKind === "predicted"
                  ? "bg-[#3b76ff] text-white font-semibold shadow-sm"
                  : "text-[#8f8f8d] hover:text-[#f3f3f1]"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#8f8f8d]" />
              <span>Predicted 18</span>
            </button>
            <button
              onClick={() => setFilterKind("verified")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all",
                filterKind === "verified"
                  ? "bg-red-500 text-white font-semibold shadow-sm"
                  : "text-red-400 hover:text-red-300"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span>Failures 6</span>
            </button>
            <button
              onClick={() => setFilterKind("protected")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all",
                filterKind === "protected"
                  ? "bg-amber-500 text-white font-semibold shadow-sm"
                  : "text-amber-400 hover:text-amber-300"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Protected 8</span>
            </button>
          </div>

          {/* Layout Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#8f8f8d]">Layout</span>
            <select
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value as "force" | "LR" | "TB")}
              className="h-8 rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] px-2.5 text-xs font-mono text-[#f3f3f1] focus:border-[#3b76ff] focus:outline-none cursor-pointer"
            >
              <option value="force">Force Directed</option>
              <option value="LR">Left to Right</option>
              <option value="TB">Top to Bottom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Workspace (Canvas + State Inspector) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Canvas Area */}
        <div className="relative flex-1 h-full w-full bg-[#080808]">
          <ReactFlow
            nodes={nodes}
            edges={filteredEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ padding: 0.12 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.25}
            maxZoom={2.2}
            className="bg-[#080808]"
          >
            <Background color="#1a1a18" gap={24} size={1} />
            
            {/* Floating Minimap and Controls Toolbar (Bottom Right) */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2.5">
              <div className="rounded-xl border border-dashed border-[#2a2a28] bg-[#0c0c0b]/95 backdrop-blur-md p-1 shadow-2xl overflow-hidden">
                <MiniMap
                  nodeColor={(n) => {
                    if (n.id === selectedNodeId) return "#3b76ff";
                    if (AGENTGARAGE_NODES[n.id]?.isFailure) return "#ef4444";
                    return "#3f3f46";
                  }}
                  maskColor="rgba(0, 0, 0, 0.75)"
                  className="!relative !m-0 !w-36 !h-24 !bg-[#0c0c0b] !rounded-lg"
                  pannable
                  zoomable
                />
              </div>

              <CanvasControls onCenterSelected={handleCenterSelected} />
            </div>
          </ReactFlow>

          {/* Floating Legend (Bottom Left) */}
          <GraphLegend />
        </div>

        {/* State Inspector Panel (Right Drawer) */}
        {isInspectorOpen && (
          <StateInspector
            node={activeNodeMeta}
            onClose={() => setIsInspectorOpen(false)}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              handleCenterSelected();
            }}
          />
        )}
      </div>

      {/* Bottom Linked Trace Drawer */}
      <LinkedTraceDrawer
        trace={AGENTGARAGE_TRACE}
        activeNodeId={selectedNodeId}
        onSelectNode={(id) => {
          setSelectedNodeId(id);
          setIsInspectorOpen(true);
        }}
      />
    </div>
  );
}

export function BehaviourGraph({ graph }: BehaviourGraphProps) {
  return (
    <ReactFlowProvider>
      <BehaviourGraphInner graph={graph} />
    </ReactFlowProvider>
  );
}
