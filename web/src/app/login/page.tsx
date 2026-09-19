"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
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

            {/* Demo mode: skip login */}
            <Link href="/dashboard" className="w-full">
              <Button className="w-full" size="lg">
                Enter Dashboard
              </Button>
            </Link>

            <p className="text-xs text-muted-foreground mt-4">
              Demo mode — no authentication required
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
