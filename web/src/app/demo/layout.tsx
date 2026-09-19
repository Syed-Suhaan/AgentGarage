"use client";

import { Shell } from "@/components/layout/shell";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Demo page uses its own full-page layout without sidebar
  return <>{children}</>;
}
