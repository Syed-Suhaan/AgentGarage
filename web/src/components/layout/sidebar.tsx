"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GitBranch,
  Activity,
  Search,
  FlaskConical,
  ShieldCheck,
  Settings,
  Zap,
  BarChart3,
  Terminal,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: BarChart3, exact: true },
  { href: "/dashboard/live", label: "Live Garage", icon: Bot },
  { href: "/dashboard/graph", label: "Behaviour Graph", icon: GitBranch },
  { href: "/dashboard/traces", label: "Traces", icon: Activity },
  { href: "/dashboard/gaps", label: "Gaps", icon: Search },
  { href: "/dashboard/sandboxes", label: "Sandboxes", icon: Terminal },
  { href: "/dashboard/evals", label: "Evals", icon: ShieldCheck },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[#2a2a28] bg-[#0c0c0b]">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-[#2a2a28] px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3b76ff] shadow-sm shadow-blue-500/20">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#f3f3f1] group-hover:text-white transition-colors">
            AgentGarage
          </span>
        </Link>
        <span className="rounded border border-dashed border-[#2a2a28] bg-[#141413] px-1.5 py-0.5 text-[10px] font-mono text-[#8f8f8d]">
          v1.0
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) ||
              (item.href === "/dashboard/sandboxes" && pathname.startsWith("/dashboard/scenarios"));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 group/nav",
                isActive
                  ? "bg-[#181816] text-white border border-[#2a2a28] shadow-sm"
                  : "text-[#8f8f8d] hover:bg-[#141413] hover:text-[#f3f3f1]"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-[#3b76ff]" : "text-[#8f8f8d] group-hover/nav:text-[#f3f3f1]"
                )}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate leading-tight text-xs font-medium">{item.label}</span>
              </div>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#3b76ff] animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Demo badge */}
      <div className="border-t border-dashed border-[#2a2a28] p-3">
        <Link
          href="/demo"
          className="flex items-center justify-between rounded-lg border border-dashed border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          <div className="flex items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Demo walkthrough</span>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
        </Link>
      </div>
    </aside>
  );
}
