"use client";

import { useGraph } from "@/lib/hooks/use-graph";
import { BehaviourGraph } from "@/components/graph/behaviour-graph";
import { GraphSkeleton } from "@/components/shared/loading-skeleton";

export default function GraphPage() {
  const { data: graph, isLoading, error } = useGraph("refund-agent");

  if (isLoading) return <div className="h-[calc(100vh-7rem)]"><GraphSkeleton /></div>;
  if (error || !graph) return <div className="p-8 text-red-400">Failed to load graph</div>;

  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)]">
      <BehaviourGraph graph={graph} />
    </div>
  );
}
