"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-6 text-center">
      <h1 className="text-6xl font-normal tracking-tight text-white">404</h1>
      <p className="mt-4 text-base text-zinc-400">This page could not be found.</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-medium text-black hover:bg-zinc-100 transition-all"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Return Home
      </Link>
    </div>
  );
}
