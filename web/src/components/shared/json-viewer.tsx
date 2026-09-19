"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  data: unknown;
  className?: string;
  defaultExpanded?: boolean;
}

export function JsonViewer({ data, className, defaultExpanded = true }: JsonViewerProps) {
  return (
    <div className={cn("rounded-md bg-zinc-950 p-4 font-mono text-xs", className)}>
      <JsonNode data={data} expanded={defaultExpanded} depth={0} />
    </div>
  );
}

function JsonNode({ data, expanded: defaultExpanded, depth }: { data: unknown; expanded: boolean; depth: number }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (data === null) return <span className="text-gray-500">null</span>;
  if (typeof data === "boolean") return <span className="text-amber-400">{String(data)}</span>;
  if (typeof data === "number") return <span className="text-blue-400">{data}</span>;
  if (typeof data === "string") return <span className="text-green-400">&quot;{data}&quot;</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-gray-500">[]</span>;
    return (
      <span>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-300">
          {expanded ? <ChevronDown className="inline h-3 w-3" /> : <ChevronRight className="inline h-3 w-3" />}
        </button>
        {expanded ? (
          <span>
            [{"\n"}
            {data.map((item, i) => (
              <span key={i} style={{ paddingLeft: (depth + 1) * 16 }} className="block">
                <JsonNode data={item} expanded={depth < 1} depth={depth + 1} />
                {i < data.length - 1 && ","}
              </span>
            ))}
            <span style={{ paddingLeft: depth * 16 }}>]</span>
          </span>
        ) : (
          <span className="text-gray-500"> [{data.length} items]</span>
        )}
      </span>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-gray-500">{"{}"}</span>;
    return (
      <span>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-300">
          {expanded ? <ChevronDown className="inline h-3 w-3" /> : <ChevronRight className="inline h-3 w-3" />}
        </button>
        {expanded ? (
          <span>
            {"{\n"}
            {entries.map(([key, value], i) => (
              <span key={key} style={{ paddingLeft: (depth + 1) * 16 }} className="block">
                <span className="text-purple-400">{key}</span>: <JsonNode data={value} expanded={depth < 1} depth={depth + 1} />
                {i < entries.length - 1 && ","}
              </span>
            ))}
            <span style={{ paddingLeft: depth * 16 }}>{"}"}  </span>
          </span>
        ) : (
          <span className="text-gray-500"> {"{ ... }"}</span>
        )}
      </span>
    );
  }

  return <span>{String(data)}</span>;
}
