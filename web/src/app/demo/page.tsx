"use client";

import { useState } from "react";
import { useSeedDemo } from "@/lib/hooks/use-demo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  CheckCircle2,
  Loader2,
  ArrowRight,
  FlaskConical,
  GitBranch,
  Search,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    step: 1,
    title: "Seed Traces",
    description: "Run the demo refund agent and capture production traces.",
    icon: Play,
    href: null,
    color: "text-blue-400",
  },
  {
    step: 2,
    title: "View Graph",
    description:
      "See the behaviour graph drawn from observed agent paths.",
    icon: GitBranch,
    href: "/dashboard/graph",
    color: "text-blue-400",
  },
  {
    step: 3,
    title: "Find Gaps",
    description:
      "The graph highlights paths the agent never took — like a timeout after a successful refund.",
    icon: Search,
    href: "/dashboard/gaps",
    color: "text-gray-400",
  },
  {
    step: 4,
    title: "Simulate Scenario",
    description:
      "The world model predicts: agent will retry and refund twice.",
    icon: FlaskConical,
    href: "/dashboard/scenarios",
    color: "text-gray-400",
  },
  {
    step: 5,
    title: "Verify in Sandbox",
    description:
      "A Fargate sandbox creates the exact timeout and runs the real agent. Ledger shows 2 refunds.",
    icon: AlertTriangle,
    href: "/dashboard/sandboxes/sb_07",
    color: "text-red-400",
  },
  {
    step: 6,
    title: "Protect with Eval",
    description:
      "The verified failure becomes a permanent regression eval. No future version can silently reintroduce it.",
    icon: ShieldCheck,
    href: "/dashboard/evals",
    color: "text-amber-400",
  },
];

export default function DemoPage() {
  const seedDemo = useSeedDemo();
  const [activeStep, setActiveStep] = useState(0);
  const [seeded, setSeeded] = useState(false);

  const handleSeed = async () => {
    await seedDemo.mutateAsync(5);
    setSeeded(true);
    setActiveStep(1);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0a] text-[#f3f3f1] font-sans antialiased">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3b76ff] shadow-lg shadow-blue-500/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-[11px] font-mono text-blue-400 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>INTERACTIVE SYSTEM WALKTHROUGH</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#f3f3f1]">
            AgentGarage Walkthrough
          </h1>
          <p className="text-[#8f8f8d] mt-2 max-w-lg mx-auto text-sm leading-relaxed">
            Watch a live refund agent get evaluated on a path it never encountered:
            a tool timeout after a successful refund.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((s, i) => {
            const isActive = i === activeStep;
            const isCompleted = i < activeStep;
            const isLocked = i > activeStep;

            return (
              <Card
                key={s.step}
                className={`transition-all duration-300 border border-dashed ${
                  isActive
                    ? "border-blue-500/60 bg-[#141413] shadow-xl shadow-blue-500/10"
                    : isCompleted
                    ? "border-[#2a2a28] bg-[#141413]/80 opacity-80"
                    : "border-[#1f1f1d] bg-[#0c0c0b] opacity-40"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400 border border-dashed border-emerald-500/40"
                          : isActive
                          ? "bg-[#3b76ff] text-white font-semibold shadow-md"
                          : "bg-[#141413] text-[#8f8f8d] border border-dashed border-[#2a2a28]"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span>{s.step}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-mono font-medium text-[#f3f3f1]">{s.title}</h3>
                        {isActive && s.step === 1 && (
                          <Button
                            size="sm"
                            onClick={handleSeed}
                            disabled={seedDemo.isPending || seeded}
                            className="bg-[#3b76ff] hover:bg-blue-500 text-white font-mono text-xs"
                          >
                            {seedDemo.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : seeded ? (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            {seeded ? "Seeded!" : "Seed 5 Traces"}
                          </Button>
                        )}
                        {isActive && s.href && (
                          <Link href={s.href}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveStep(i + 1)}
                              className="border-dashed border-[#2a2a28] bg-[#141413] hover:border-zinc-400 font-mono text-xs"
                            >
                              Open Step
                              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                      <p className="text-xs text-[#8f8f8d] mt-1.5 leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Completion */}
        {activeStep >= STEPS.length && (
          <Card className="mt-8 border border-dashed border-emerald-500/40 bg-emerald-500/5">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-mono font-semibold text-[#f3f3f1]">Walkthrough Complete</h3>
              <p className="text-sm font-mono text-[#8f8f8d] mt-1">
                The duplicate-refund failure is now a permanent regression eval.
                Every future agent version will be tested against it in CI/CD.
              </p>
              <div className="mt-4">
                <Link href="/dashboard">
                  <Button size="sm" className="bg-[#3b76ff] hover:bg-blue-500 text-white font-mono text-xs">
                    Return to Dashboard Overview
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
