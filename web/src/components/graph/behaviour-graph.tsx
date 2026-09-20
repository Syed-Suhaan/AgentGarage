"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
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
  getAgentReferenceData,
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

const AGENT_OPTIONS = [
  { id: "sre-agent", label: "SRE Agent (Autonomous Bedrock Remediation)" },
  { id: "refund-agent", label: "Customer Support Agent (Refund Dialogue)" },
];

function BehaviourGraphInner({ graph: _graph }: BehaviourGraphProps) {
  const [agentKey, setAgentKey] = useState<string>("sre-agent");
  const [layoutMode, setLayoutMode] = useState<"force" | "LR" | "TB">("force");
  const [filterKind, setFilterKind] = useState<FilterKind>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("Last 7 days");

  const { fitView, setCenter } = useReactFlow();

  // Active agent reference dataset
  const activeDataset = useMemo(() => getAgentReferenceData(agentKey), [agentKey]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(activeDataset.initialSelected);

  // When agent switches, reset selected node to initial focal hub
  useEffect(() => {
    setSelectedNodeId(activeDataset.initialSelected);
  }, [activeDataset]);

  // Compute graph nodes and edges using active dataset and layout mode
  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => layoutGraph(undefined, layoutMode, activeDataset.nodes, activeDataset.edges),
    [layoutMode, activeDataset]
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

  // Highlight selected node and filter by search query
  const nodes = useMemo(() => {
    return rawNodes.map((n) => {
      const isSelected = n.id === selectedNodeId;
      const meta = activeDataset.nodes[n.id];
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
  }, [rawNodes, selectedNodeId, searchQuery, activeDataset]);

  // Auto-fit on layout or agent change
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.14, duration: 600 });
    }, 120);
    return () => clearTimeout(timer);
  }, [layoutMode, agentKey, fitView]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setIsInspectorOpen(true);
  }, []);

  const handleCenterSelected = useCallback(() => {
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node) {
      setCenter(node.position.x + 56, node.position.y + 56, { zoom: 1.15, duration: 600 });
    } else {
      fitView({ padding: 0.14, duration: 500 });
    }
  }, [nodes, selectedNodeId, setCenter, fitView]);

  const activeNodeMeta: ReferenceNodeMetadata =
    activeDataset.nodes[selectedNodeId] ||
    activeDataset.nodes[activeDataset.initialSelected] ||
    Object.values(activeDataset.nodes)[0];

  return (
    <div className="flex h-full w-full flex-col bg-[#080808] text-[#f3f3f1] overflow-hidden select-none font-sans">
      {/* Top Filter & Toolbar Bar */}
      <div className="border-b border-[#2a2a28] bg-[#0c0c0b] px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Interactive Agent Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] px-3 py-1.5 font-mono text-xs text-[#f3f3f1] hover:border-zinc-500 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#3b76ff] animate-pulse" />
              <span className="font-semibold">{activeDataset.agentName}</span>
              <ChevronDown className="h-3 w-3 text-[#8f8f8d]" />
            </button>

            {isAgentMenuOpen && (
              <div className="absolute left-0 top-9 z-50 w-72 rounded-xl border border-[#2a2a28] bg-[#141413] p-1.5 shadow-2xl font-mono text-xs">
                {AGENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setAgentKey(opt.id);
                      setIsAgentMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors",
                      agentKey === opt.id
                        ? "bg-[#3b76ff]/20 text-[#3b76ff] font-semibold"
                        : "text-[#8f8f8d] hover:bg-[#1a1a18] hover:text-[#f3f3f1]"
                    )}
                  >
                    <span>{opt.label}</span>
                    {agentKey === opt.id && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time Range Selector */}
          <div className="relative">
            <button
              onClick={() => setTimeRange(timeRange === "Last 7 days" ? "Last 24 hours" : "Last 7 days")}
              className="flex items-center gap-2 rounded-lg border border-dashed border-[#2a2a28] bg-[#141413] px-3 py-1.5 font-mono text-xs text-[#8f8f8d] hover:text-[#f3f3f1] hover:border-zinc-500 transition-colors"
            >
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
          {/* Filter Pills with Counts matching reference mockup */}
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
            fitViewOptions={{ padding: 0.14 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.2}
            maxZoom={2.4}
            className="bg-[#080808]"
          >
            <Background color="#1a1a18" gap={24} size={1} />

            {/* Floating Legend Overlay (Bottom Left) matching reference screenshot */}
            <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
              <GraphLegend />
            </div>

            {/* Floating Controls Toolbar (Bottom Right) */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2.5">
              <CanvasControls onCenterSelected={handleCenterSelected} />
            </div>
          </ReactFlow>
        </div>

        {/* Right column: Full-Height State Inspector */}
        <div className="w-80 sm:w-96 shrink-0 border-l border-[#2a2a28] bg-[#0c0c0b] flex flex-col h-full overflow-hidden z-20">
          {isInspectorOpen ? (
            <StateInspector
              node={activeNodeMeta}
              onClose={() => setIsInspectorOpen(false)}
              onSelectNode={(id) => {
                setSelectedNodeId(id);
                handleCenterSelected();
              }}
            />
          ) : (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center text-xs font-mono text-[#8f8f8d]">
              <p>Inspector Closed</p>
              <button
                onClick={() => setIsInspectorOpen(true)}
                className="mt-2 text-[#3b76ff] hover:underline"
              >
                Open State Inspector
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Linked Trace Drawer */}
      <LinkedTraceDrawer
        trace={activeDataset.trace}
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
