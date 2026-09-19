"use client";

import Image from "next/image";

const MARQUEE_LOGOS = [
  { name: "Vercel", file: "vercel.svg", width: 110, height: 28 },
  { name: "Adobe", file: "adobe.svg", width: 115, height: 28 },
  { name: "Shopify", file: "shopify.svg", width: 110, height: 32 },
  { name: "Stripe", file: "stripe.svg", width: 85, height: 32 },
  { name: "OpenAI", file: "openai.svg", width: 110, height: 30 },
  { name: "Netflix", file: "Netflix_Icon.svg", width: 100, height: 28 },
  { name: "Clerk", file: "clerk.svg", width: 95, height: 28 },
  { name: "Perplexity", file: "perplexity.svg", width: 125, height: 30 },
  { name: "Snapchat", file: "snapchat.svg", width: 110, height: 32 },
];

export function LogoMarquee() {
  return (
    <section className="relative w-full border-t border-[#1a1a19] bg-black py-20 overflow-hidden">
      {/* Centered Pill Label (Exact Match to Image 1) */}
      <div className="flex justify-center mb-14">
        <div className="rounded border border-white/10 bg-white/[0.02] px-4 py-1.5 text-xs text-zinc-400 font-mono tracking-tight">
          Teams already signed up for early access
        </div>
      </div>

      {/* Marquee Track */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-10 px-8 flex-wrap opacity-65 grayscale hover:grayscale-0 transition-all duration-500">
        {MARQUEE_LOGOS.map((logo) => (
          <div key={logo.name} className="flex items-center justify-center h-8">
            <Image
              src={`/marquee/${logo.file}`}
              alt={logo.name}
              width={logo.width}
              height={logo.height}
              unoptimized
              className="h-7 w-auto max-w-[130px] object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
