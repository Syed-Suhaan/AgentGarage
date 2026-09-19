import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#3b76ff] text-white hover:bg-blue-500 shadow-sm",
        secondary: "border border-dashed border-[#2a2a28] bg-[#141413] text-[#8f8f8d] hover:text-[#f3f3f1]",
        destructive: "border border-dashed border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20",
        outline: "border border-dashed border-[#2a2a28] text-[#f3f3f1] bg-transparent",
        observed: "border border-dashed border-blue-500/40 bg-blue-500/10 text-blue-400 font-mono",
        predicted: "border border-dashed border-zinc-500/40 bg-zinc-500/10 text-zinc-300 font-mono",
        verified: "border border-dashed border-red-500/40 bg-red-500/10 text-red-400 font-mono",
        protected: "border border-dashed border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono",
        dashed: "border border-dashed border-[#2a2a28] bg-[#141413] text-[#8f8f8d] font-mono",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
