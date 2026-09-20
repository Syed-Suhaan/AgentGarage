import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listSandboxes, promoteSandbox } from "@/lib/api";

export function useSandboxes(refetchInterval = 5000) {
  return useQuery({
    queryKey: ["sandboxes"],
    queryFn: () => listSandboxes(),
    refetchInterval: (query) => {
      const data = query.state.data;
      // Keep polling while any sandbox is still running
      if (data?.sandboxes?.some((s) => s.status === "running")) return refetchInterval;
      return false;
    },
  });
}

export function usePromoteSandbox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sandboxId: string) => promoteSandbox(sandboxId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evals"] });
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
}
