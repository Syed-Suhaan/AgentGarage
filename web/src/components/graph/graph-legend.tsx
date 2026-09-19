import { statusConfig } from "@/lib/status-colors";
import type { EdgeKind } from "@/lib/types";

const statuses: EdgeKind[] = ["observed", "predicted", "verified", "protected"];

export function GraphLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-dashed border-[#2a2a28] bg-[#141413]/90 backdrop-blur-md p-3.5 shadow-2xl">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8f8f8d] mb-2.5">
        Lifecycle State
      </p>
      <div className="space-y-2">
        {statuses.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: statusConfig[s].color }}
            />
            <span className="text-xs font-mono text-[#f3f3f1] capitalize">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
