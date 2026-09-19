"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, ArrowRight, Zap, Eye, FlaskConical, Terminal, ShieldCheck } from "lucide-react";

const NAV = [
  {
    label: "Platform",
    items: [
      { name: "Behaviour graph", href: "/dashboard/graph" },
      { name: "Gap detector", href: "/dashboard/gaps" },
      { name: "Sandbox", href: "/dashboard/sandboxes" },
      { name: "Evals", href: "/dashboard/evals" },
    ],
  },
  {
    label: "Coverage",
    items: [
      { name: "Observed", href: "/dashboard/traces" },
      { name: "Predicted", href: "/dashboard/gaps" },
      { name: "Verified", href: "/dashboard/sandboxes" },
      { name: "Protected", href: "/dashboard/evals" },
    ],
  },
  {
    label: "Docs",
    items: [
      { name: "Architecture", href: "/dashboard" },
      { name: "Demo", href: "/demo" },
      { name: "Settings", href: "/dashboard/settings" },
    ],
  },
];

const PHASES = [
  {
    kicker: "Observed",
    title: "Map every path your agent actually took.",
    desc: "Production traces become a time-versioned graph of states, decisions and outcomes.",
    detail: "5 states · 5 edges · tr_84f2",
    orb: "from-blue-500/60 via-slate-200/40 to-zinc-900",
  },
  {
    kicker: "Predicted",
    title: "Flag reachable paths it never tried.",
    desc: "Legal state-action pairs with no observed run are scored by risk and novelty.",
    detail: "refund_succeeded + tool_timeout · sc_19",
    orb: "from-zinc-400/50 via-neutral-200/30 to-zinc-900",
  },
  {
    kicker: "Verified",
    title: "Replay hypotheses against the real agent.",
    desc: "One isolated sandbox per scenario. Fixed rule checks move predicted to verified — never a model’s word.",
    detail: "sb_07 · refund_calls = 2 · FAIL",
    orb: "from-red-500/60 via-rose-200/40 to-zinc-900",
  },
  {
    kicker: "Protected",
    title: "Keep every failure as a permanent eval.",
    desc: "Verified failures compile to portable YAML evals re-run on every future version.",
    detail: "eval_duplicate_refund · protected",
    orb: "from-amber-500/60 via-yellow-100/30 to-zinc-900",
  },
];

const PILLARS = [
  { k: "Observe", t: "Production-grounded map, not a trace viewer.", d: "States and edges with counts, versions and sources." },
  { k: "Hypothesize", t: "World-model proposals, explicitly unconfirmed.", d: "Predicted stays grey until the sandbox reproduces it." },
  { k: "Isolate", t: "Fargate sandboxes with no network.", d: "Restore state, inject one fault, run the same agent." },
  { k: "Enforce", t: "Evals that block silent regressions.", d: "Assert-first checks like refund_calls <= 1." },
];

function Orb({ tint }: { tint: string }) {
  return (
    <div className="relative h-[380px] w-[380px] shrink-0 overflow-hidden rounded-full border border-white/10 sm:h-[440px] sm:w-[440px]">
      <div className={`absolute inset-0 bg-gradient-to-br ${tint} blur-[1px]`} />
      <div className="absolute inset-4 rounded-full border border-white/20" />
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.5),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.55),transparent_50%)]" />
      <div className="absolute inset-8 rounded-full bg-[conic-gradient(from_40deg,transparent,rgba(255,255,255,0.25),transparent_40%)] blur-xl" />
    </div>
  );
}

function PhaseSection({ p, index }: { p: (typeof PHASES)[number]; index: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  // Scroll → normalized progress → scale + rotation + reveal (directly driven, reversible)
  const scale = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0.03, 0.14, 0.55, 0.88, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 38]);
  const driftX = useTransform(scrollYProgress, [0, 0.25, 1], [0, 12, 150]);
  const descOpacity = useTransform(scrollYProgress, [0.15, 0.45], [0, 1]);
  const descY = useTransform(scrollYProgress, [0.15, 0.5], [28, 0]);
  const detailOpacity = useTransform(scrollYProgress, [0.5, 0.8], [0, 1]);
  const detailY = useTransform(scrollYProgress, [0.5, 0.8], [20, 0]);
  const headingOpacity = useTransform(scrollYProgress, [0, 0.2], [0.55, 1]);

  return (
    <div ref={trackRef} className="relative h-[240vh] border-b border-white/5">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-4">
        <motion.p style={{ opacity: headingOpacity }} className="text-sm text-zinc-500">
          {p.kicker}
        </motion.p>
        <motion.h2
          style={{ opacity: headingOpacity }}
          className="mt-3 max-w-3xl text-center text-3xl font-medium tracking-tight sm:text-5xl text-white"
        >
          {p.title}
        </motion.h2>

        {/* Dot origin: perfectly centered under heading, grows into the circle */}
        <div className="mt-8 flex h-[300px] items-center justify-center sm:h-[380px]">
          <motion.div
            style={{ scale, rotate, x: driftX, transformOrigin: "center center" }}
            className="will-change-transform"
          >
            <Orb tint={p.orb} />
          </motion.div>
        </div>

        <motion.p
          style={{ opacity: descOpacity, y: descY }}
          className="mt-6 max-w-md text-center text-sm leading-relaxed text-zinc-400"
        >
          {p.desc}
        </motion.p>
        <motion.p
          style={{ opacity: detailOpacity, y: detailY }}
          className="mt-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500"
        >
          {p.detail}
        </motion.p>

        {/* Scroll-linked progress */}
        <div className="mt-6 h-px w-full max-w-xl bg-white/10">
          <motion.div className="h-px origin-left bg-white" style={{ scaleX: scrollYProgress }} />
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-700">
          {index + 1} / {PHASES.length}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased selection:bg-white/20 selection:text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 shadow-md shadow-blue-500/20">
              <Zap className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
              AgentGarage
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((n) => (
              <div key={n.label} className="relative group">
                <button className="flex items-center gap-1 text-sm text-zinc-300 hover:text-white transition-colors py-2">
                  {n.label} <ChevronDown className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
                <div className="absolute top-full left-0 hidden group-hover:flex flex-col min-w-[180px] rounded-xl border border-white/10 bg-[#141413]/95 backdrop-blur-md p-2 shadow-2xl z-50">
                  {n.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link href="/demo" className="text-sm text-zinc-300 hover:text-white transition-colors">
              Demo
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white transition-all shadow-sm"
            >
              Open dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:pt-28">
        <h1 className="text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl text-white">
          Behavioural coverage
          <br />
          for AI agents.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          Agents don’t follow scripts — they choose tools, retry, and branch on what they observe.
          AgentGarage maps which behaviours were exercised, predicts untested paths, verifies them
          in isolation, and keeps every failure as a permanent eval.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/dashboard/graph"
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-white transition-all shadow-md"
          >
            Start with the graph <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-6 py-3 text-sm text-zinc-200 hover:border-white/30 transition-all backdrop-blur-sm"
          >
            Run the 6-step demo
          </Link>
        </div>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          Observed → Predicted → Verified → Protected
        </p>
      </section>

      {/* Phases — Scroll-driven alternating storytelling with orbs */}
      <section className="border-t border-white/5">
        {PHASES.map((p, i) => (
          <PhaseSection key={p.kicker} p={p} index={i} />
        ))}
      </section>

      {/* Trust strip */}
      <section className="border-b border-white/5 py-14">
        <p className="text-center text-xs text-zinc-500">Runs inside your AWS account — same primitives you already trust</p>
        <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-sm font-medium text-zinc-500">
          {["S3", "DynamoDB", "OpenSearch", "Fargate", "Step Functions", "Bedrock", "CDK", "Next.js"].map((t) => (
            <span key={t} className="hover:text-zinc-300 transition-colors">{t}</span>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <h2 className="text-3xl font-medium tracking-tight sm:text-5xl text-white">Built for agent reliability.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Coverage, not just observability. Every verified failure permanently expands the agent’s safety perimeter.
        </p>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((c) => (
            <div key={c.k} className="bg-[#111] p-6 hover:bg-[#141413] transition-colors">
              <p className="text-xs text-zinc-500">{c.k}</p>
              <h3 className="mt-3 text-lg font-medium leading-snug text-white">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live loop card */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div>
            <p className="text-xs text-zinc-500">Judge proof · live</p>
            <p className="mt-2 font-mono text-5xl font-medium text-white">2</p>
            <p className="text-sm text-zinc-500">refunds on the timeout path</p>
            <p className="mt-6 font-mono text-5xl font-medium text-white">1</p>
            <p className="text-sm text-zinc-500">permanent eval written</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111] shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/10 p-4 text-sm font-medium text-white">
              <Terminal className="h-4 w-4 text-blue-400" /> Sandbox sb_07 — streaming
            </div>
            <div className="space-y-2 p-4 font-mono text-xs leading-relaxed bg-[#0c0c0b]">
              <p className="text-zinc-500">&gt; restoring refund_pending state</p>
              <p className="text-zinc-400">&gt; injecting issue_refund → timeout_after_success</p>
              <p className="text-blue-400">&gt; issue_refund → SUCCESS but TIMEOUT to agent</p>
              <p className="text-red-400">&gt; issue_refund RETRY — duplicate refund</p>
              <p className="text-red-400">&gt; INVARIANT FAIL: refund_calls = 2 (expected ≤ 1)</p>
            </div>
            <div className="flex gap-2 border-t border-white/10 p-4 bg-[#111]">
              <Link href="/dashboard/sandboxes/sb_07" className="inline-flex items-center gap-1 rounded-full border border-white/15 px-4 py-2 text-xs text-zinc-200 hover:border-white/30 transition-all">
                Open sandbox <ArrowRight className="h-3 w-3" />
              </Link>
              <Link href="/dashboard/evals" className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-900 hover:bg-white transition-all">
                View eval
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform grid */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <p className="text-xs text-zinc-500">The platform</p>
        <h2 className="mt-2 text-3xl font-medium tracking-tight sm:text-5xl text-white">Everything in one place.</h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 md:grid-cols-3">
          {[
            { icon: Eye, t: "Behaviour graph", d: "States, decisions and outcomes with live counts.", href: "/dashboard/graph" },
            { icon: FlaskConical, t: "Gap detector", d: "Unexplored state-action pairs ranked by risk.", href: "/dashboard/gaps" },
            { icon: Terminal, t: "Sandbox", d: "Isolated replay with streaming logs.", href: "/dashboard/sandboxes" },
            { icon: ShieldCheck, t: "Evals", d: "Portable regression files with history.", href: "/dashboard/evals" },
            { icon: Zap, t: "Demo", d: "Seed → graph → gap → sandbox → protect.", href: "/demo" },
            { icon: ArrowRight, t: "Overview", d: "Coverage gauge and core loop in one view.", href: "/dashboard" },
          ].map((c) => (
            <div key={c.t} className="bg-[#0e0e0e] p-6 hover:bg-[#121211] transition-colors">
              <c.icon className="h-5 w-5 text-zinc-400" />
              <h3 className="mt-4 text-lg font-medium text-white">{c.t}</h3>
              <p className="mt-1 text-sm text-zinc-400">{c.d}</p>
              <Link href={c.href} className="mt-5 inline-flex items-center gap-1 rounded-full border border-white/15 px-4 py-2 text-xs text-zinc-200 hover:border-white/30 transition-all">
                Open {c.t} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA + footer */}
      <section className="border-t border-white/5 px-4 py-20 text-center">
        <h2 className="text-3xl font-medium tracking-tight sm:text-5xl text-white">Start mapping your agent.</h2>
        <p className="mt-3 text-sm text-zinc-400">From production trace to permanent protection.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-white transition-all shadow-md">
            Open dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <footer className="mx-auto mt-16 grid max-w-6xl gap-8 border-t border-white/5 pt-10 text-left md:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-white">AgentGarage</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">Private behavioural assurance for AI agents. Deploys in your AWS account.</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">Product</p>
            <div className="mt-2 space-y-1 text-sm text-zinc-500">
              <p><Link href="/dashboard/graph" className="hover:text-zinc-300 transition-colors">Graph</Link></p>
              <p><Link href="/dashboard/gaps" className="hover:text-zinc-300 transition-colors">Gaps</Link></p>
              <p><Link href="/dashboard/evals" className="hover:text-zinc-300 transition-colors">Evals</Link></p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">Resources</p>
            <div className="mt-2 space-y-1 text-sm text-zinc-500">
              <p><Link href="/demo" className="hover:text-zinc-300 transition-colors">Demo</Link></p>
              <p><Link href="/dashboard/settings" className="hover:text-zinc-300 transition-colors">Settings</Link></p>
              <p><Link href="/login" className="hover:text-zinc-300 transition-colors">Login</Link></p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">Trust</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">Predicted is hypothesis until the real agent reproduces it. No path is marked failed on a model’s word.</p>
          </div>
        </footer>
      </section>
    </div>
  );
}
