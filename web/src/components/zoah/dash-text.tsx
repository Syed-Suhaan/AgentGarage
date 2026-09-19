"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DashTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
  withCaret?: boolean;
  withDashUnderline?: boolean;
}

/**
 * Zoah-style text with animated flowing dashed underline or terminal blinking dash caret
 */
export function DashText({
  children,
  className,
  withCaret = false,
  withDashUnderline = false,
  ...props
}: DashTextProps) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center",
        withDashUnderline && "zoah-dashed-underline pb-0.5",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {withCaret && (
        <span
          aria-hidden="true"
          className="ml-1 inline-block h-3.5 w-1.5 bg-current animate-caret-blink align-baseline"
        />
      )}
    </span>
  );
}

/**
 * Zoah-style card with dashed corner ticks or dashed border styling
 */
export function DashCard({
  children,
  className,
  dashed = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { dashed?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-[#141413] transition-all duration-300",
        dashed ? "border border-dashed border-[#2a2a28] hover:border-zinc-500/60" : "border border-[#2a2a28]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
