"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, Database, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#2a2a28] bg-[#141413] px-3 py-0.5 text-[11px] font-mono text-[#8f8f8d] mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3b76ff] animate-pulse" />
          <span>SETTINGS</span>
        </div>
        <h1 className="text-2xl font-normal text-[#f3f3f1] tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-[#8f8f8d] mt-1">
          Agent registry, BYOK model endpoint, and retention.
        </p>
      </div>

      {/* Agent Config */}
      <Card className="border border-dashed border-[#2a2a28] bg-[#141413]">
        <CardHeader className="border-b border-[#1f1f1d]">
          <CardTitle className="text-sm font-mono flex items-center gap-2 text-[#f3f3f1]">
            <Settings className="h-4 w-4 text-[#3b76ff]" />
            Agent
          </CardTitle>
          <CardDescription className="text-xs font-mono text-[#8f8f8d]">
            Registered agent and OTLP collector endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-mono uppercase text-[#8f8f8d]">Agent ID</label>
              <input
                type="text"
                defaultValue="sre-agent"
                className="mt-1 h-9 w-full rounded-lg border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-3 text-xs font-mono text-[#f3f3f1]"
                readOnly
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-[#8f8f8d]">Version</label>
              <input
                type="text"
                defaultValue="1.8.2"
                className="mt-1 h-9 w-full rounded-lg border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-3 text-xs font-mono text-[#f3f3f1]"
                readOnly
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-[#8f8f8d]">
              OTLP Collector Endpoint
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                defaultValue="https://collector.agentgarage.example.com/v1/traces"
                className="h-9 flex-1 rounded-lg border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-3 text-xs font-mono text-[#f3f3f1]"
                readOnly
              />
              <Badge variant="secondary" className="font-mono text-[11px]">OTLP/gRPC</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BYOK Model */}
      <Card className="border border-dashed border-[#2a2a28] bg-[#141413]">
        <CardHeader className="border-b border-[#1f1f1d]">
          <CardTitle className="text-sm font-mono flex items-center gap-2 text-[#f3f3f1]">
            <Key className="h-4 w-4 text-[#3b76ff]" />
            Model (BYOK)
          </CardTitle>
          <CardDescription className="text-xs font-mono text-[#8f8f8d]">
            Optional custom model endpoint. Default is Bedrock in-region for world-model proposals.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-xs font-mono uppercase text-[#8f8f8d]">
              Default model
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                defaultValue="Bedrock Claude Sonnet (in-region)"
                className="h-9 flex-1 rounded-lg border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-3 text-xs font-mono text-[#f3f3f1]"
                readOnly
              />
              <Badge variant="observed" className="font-mono text-[11px]">Default</Badge>
            </div>
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-[#8f8f8d]">
              Custom endpoint (optional)
            </label>
            <input
              type="text"
              placeholder="https://api.openai.com/v1"
              className="mt-1 h-9 w-full rounded-lg border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-3 text-xs font-mono text-[#f3f3f1] placeholder:text-zinc-600 focus:border-[#3b76ff] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-[#8f8f8d]">
              AWS Secrets Manager ARN
            </label>
            <input
              type="text"
              placeholder="arn:aws:secretsmanager:ap-south-1:..."
              className="mt-1 h-9 w-full rounded-lg border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-3 text-xs font-mono text-[#f3f3f1] placeholder:text-zinc-600 focus:border-[#3b76ff] focus:outline-none"
            />
          </div>
          <Button size="sm" variant="outline" className="border-dashed border-[#2a2a28] bg-[#141413] hover:border-zinc-400 font-mono text-xs">
            Save model settings
          </Button>
        </CardContent>
      </Card>

      {/* Data Controls */}
      <Card className="border border-dashed border-[#2a2a28] bg-[#141413]">
        <CardHeader className="border-b border-[#1f1f1d]">
          <CardTitle className="text-sm font-mono flex items-center gap-2 text-[#f3f3f1]">
            <Shield className="h-4 w-4 text-[#3b76ff]" />
            Data & retention
          </CardTitle>
          <CardDescription className="text-xs font-mono text-[#8f8f8d]">
            Traces stay in your account. Redaction runs before storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-mono uppercase text-[#8f8f8d]">
                Trace retention
              </label>
              <input
                type="text"
                defaultValue="90 days"
                className="mt-1 h-9 w-full rounded-lg border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-3 text-xs font-mono text-[#f3f3f1]"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-[#8f8f8d]">
                Sandbox log retention
              </label>
              <input
                type="text"
                defaultValue="30 days"
                className="mt-1 h-9 w-full rounded-lg border border-dashed border-[#2a2a28] bg-[#0b0b0a] px-3 text-xs font-mono text-[#f3f3f1]"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-[#8f8f8d]">
                Eval files
              </label>
              <input
                type="text"
                defaultValue="Permanent"
                className="mt-1 h-9 w-full rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-mono text-emerald-400"
                readOnly
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-dashed border-amber-500/30">
            <Database className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-xs font-mono text-[#8f8f8d]">
              Eval files are permanent. The UI cannot delete or silently weaken them.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
