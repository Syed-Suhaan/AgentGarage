import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface ShellProps {
  children: React.ReactNode;
  coveragePercent?: number;
}

export function Shell({ children, coveragePercent }: ShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0b0a] text-[#f3f3f1] font-sans antialiased">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar coveragePercent={coveragePercent} />
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
