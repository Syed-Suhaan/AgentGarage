import { useQuery, useMutation } from "@tanstack/react-query";
import { getSandbox, startSandbox } from "@/lib/api";
import type { SandboxResult } from "@/lib/types";

export function useSandbox(sandboxId: string) {
  return useQuery<SandboxResult>({
    queryKey: ["sandbox", sandboxId],
    queryFn: () => getSandbox(sandboxId),
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling once sandbox is no longer running
      if (data && data.status !== "running") return false;
      return 2000;
    },
  });
}

export function useStartSandbox() {
  return useMutation({
    mutationFn: (scenarioId: string) => startSandbox(scenarioId),
  });
}
