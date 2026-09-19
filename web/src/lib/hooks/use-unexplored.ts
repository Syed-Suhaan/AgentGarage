import { useQuery } from "@tanstack/react-query";
import { getUnexplored } from "@/lib/api";
import type { UnexploredGap } from "@/lib/types";

export function useUnexplored(agentId: string) {
  return useQuery<UnexploredGap[]>({
    queryKey: ["unexplored", agentId],
    queryFn: () => getUnexplored(agentId),
  });
}
