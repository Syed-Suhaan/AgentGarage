"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-6 text-center">
      <h1 className="text-4xl font-normal tracking-tight text-white">Something went wrong</h1>
      <p className="mt-4 max-w-md text-sm text-zinc-400">
        {error.message || "An unexpected error occurred while rendering the page."}
      </p>
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-medium text-black hover:bg-zinc-100 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-xs text-zinc-300 hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
      </div>
    </div>
  );
}
