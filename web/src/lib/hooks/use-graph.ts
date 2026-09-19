import { useQuery } from "@tanstack/react-query";
import { getGraph } from "@/lib/api";
import type { AgentGraph } from "@/lib/types";

export function useGraph(agentId: string) {
  return useQuery<AgentGraph>({
    queryKey: ["graph", agentId],
    queryFn: () => getGraph(agentId),
  });
}
