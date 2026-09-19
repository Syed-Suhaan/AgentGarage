import { useMutation, useQueryClient } from "@tanstack/react-query";
import { simulate } from "@/lib/api";

export function useSimulate(agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { unexplored_state: string; untried_action: string }) =>
      simulate(agentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", agentId] });
      queryClient.invalidateQueries({ queryKey: ["unexplored", agentId] });
    },
  });
}
