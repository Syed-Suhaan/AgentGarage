"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { login, loginAsGuest } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"guest" | "user" | null>(null);

  async function enter(kind: "guest" | "user", fn: () => Promise<void>) {
    setError("");
    setLoading(kind);
    try {
      await fn();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await enter("user", () => login(username, password));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 mb-4">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold">AgentGarage</h1>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Behavioural coverage for AI agents
            </p>

            <Button
              className="w-full"
              size="lg"
              type="button"
              disabled={loading !== null}
              onClick={() => enter("guest", loginAsGuest)}
            >
              {loading === "guest" ? "Entering…" : "Continue as Guest"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 mb-5">
              Shared demo account · full live API access
            </p>

            <div className="w-full flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                or sign in
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={onSubmit} className="w-full space-y-3 text-left">
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                required
              />
              <input
                type="password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
              />
              {error ? (
                <p className="text-xs text-red-500">{error}</p>
              ) : null}
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                type="submit"
                disabled={loading !== null}
              >
                {loading === "user" ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
