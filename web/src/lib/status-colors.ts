import { EdgeKind } from "./types";

export const statusConfig: Record<EdgeKind, {
  color: string;
  bg: string;
  border: string;
  label: string;
  className: string;
}> = {
  observed: {
    color: "#3b82f6",
    bg: "bg-blue-500/10",
    border: "border-blue-500",
    label: "Observed",
    className: "text-blue-400",
  },
  predicted: {
    color: "#6b7280",
    bg: "bg-gray-500/10",
    border: "border-gray-500",
    label: "Predicted",
    className: "text-gray-400",
  },
  verified: {
    color: "#ef4444",
    bg: "bg-red-500/10",
    border: "border-red-500",
    label: "Verified",
    className: "text-red-400",
  },
  protected: {
    color: "#f59e0b",
    bg: "bg-amber-500/10",
    border: "border-amber-500",
    label: "Protected",
    className: "text-amber-400",
  },
};

export function getStatusColor(kind: EdgeKind): string {
  return statusConfig[kind].color;
}

export function getStatusBg(kind: EdgeKind): string {
  return statusConfig[kind].bg;
}
