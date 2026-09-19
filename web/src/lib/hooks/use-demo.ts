import { useMutation } from "@tanstack/react-query";
import { seedDemo } from "@/lib/api";

export function useSeedDemo() {
  return useMutation({
    mutationFn: (runs: number) => seedDemo({ runs }),
  });
}
