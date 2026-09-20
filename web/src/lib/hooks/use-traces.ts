import { useQuery } from "@tanstack/react-query";
import { listTraces } from "@/lib/api";

export function useTraces(agentId?: string) {
  return useQuery({
    queryKey: ["traces", agentId || "all"],
    queryFn: () => listTraces(agentId),
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
