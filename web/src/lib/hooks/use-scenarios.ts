import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listScenarios, simulate } from "@/lib/api";

export function useScenarios(agentId: string) {
  return useQuery({
    queryKey: ["scenarios", agentId],
    queryFn: () => listScenarios(agentId),
  });
}

export function useSimulate(agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { unexplored_state: string; untried_action: string }) =>
      simulate(agentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", agentId] });
      queryClient.invalidateQueries({ queryKey: ["unexplored", agentId] });
      queryClient.invalidateQueries({ queryKey: ["scenarios", agentId] });
    },
  });
}
