import { Badge } from "@/components/ui/badge";
import type { EdgeKind } from "@/lib/types";

interface StatusBadgeProps {
  status: EdgeKind | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = ["observed", "predicted", "verified", "protected"].includes(status)
    ? (status as "observed" | "predicted" | "verified" | "protected")
    : "outline";

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}
