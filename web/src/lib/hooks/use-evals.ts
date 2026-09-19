import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listEvals, runEvals } from "@/lib/api";

export function useEvals() {
  return useQuery({
    queryKey: ["evals"],
    queryFn: () => listEvals(),
  });
}

export function useRunEvals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { agent_version: string }) => runEvals(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evals"] });
    },
  });
}
