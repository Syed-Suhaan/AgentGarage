"use client";

import React from "react";

/**
 * 1. OBSERVE: Production-grounded map UI wireframe
 * Frame with subpanels, skeleton text, and action pill buttons (clean without cursor pointer).
 */
export function WireframeObserve() {
  return (
    <svg
      viewBox="0 0 240 130"
      className="w-full max-w-[240px] h-auto text-zinc-500 select-none overflow-visible"
      fill="none"
      stroke="currentColor"
    >
      {/* Outer panel */}
      <rect
        x="12"
        y="10"
        width="216"
        height="76"
        rx="6"
        strokeWidth="1.25"
        stroke="currentColor"
      />

      {/* Inner left panel with skeleton text */}
      <rect
        x="22"
        y="20"
        width="76"
        height="46"
        rx="4"
        strokeWidth="1.25"
        stroke="currentColor"
      />
      <line
        x1="30"
        y1="34"
        x2="78"
        y2="34"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />
      <line
        x1="30"
        y1="44"
        x2="64"
        y2="44"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />

      {/* Inner right main panel */}
      <rect
        x="108"
        y="20"
        width="110"
        height="54"
        rx="4"
        strokeWidth="1.25"
        stroke="currentColor"
      />

      {/* Bottom controls: 2 pill buttons */}
      {/* Left solid pill with skeleton line */}
      <rect
        x="12"
        y="96"
        width="98"
        height="20"
        rx="10"
        strokeWidth="1.25"
        stroke="currentColor"
      />
      <line
        x1="26"
        y1="106"
        x2="88"
        y2="106"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />

      {/* Right pill with dashed stroke */}
      <rect
        x="120"
        y="96"
        width="98"
        height="20"
        rx="10"
        strokeWidth="1.25"
        stroke="currentColor"
        strokeDasharray="4 3"
      />
      <line
        x1="134"
        y1="106"
        x2="196"
        y2="106"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
        strokeDasharray="3 3"
      />
    </svg>
  );
}

/**
 * 2. HYPOTHESIZE: World-model proposals / Canvas wireframe
 * Frame with 3 floating cards (clean without cursor pointer).
 */
export function WireframeHypothesize() {
  return (
    <svg
      viewBox="0 0 240 130"
      className="w-full max-w-[240px] h-auto text-zinc-500 select-none overflow-visible"
      fill="none"
      stroke="currentColor"
    >
      {/* Outer canvas frame */}
      <rect
        x="10"
        y="12"
        width="220"
        height="106"
        rx="6"
        strokeWidth="1.25"
        stroke="currentColor"
      />

      {/* Left card */}
      <rect
        x="24"
        y="26"
        width="82"
        height="76"
        rx="5"
        strokeWidth="1.25"
        stroke="currentColor"
      />
      <line
        x1="34"
        y1="42"
        x2="88"
        y2="42"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />
      <line
        x1="34"
        y1="52"
        x2="70"
        y2="52"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />
      <rect
        x="34"
        y="66"
        width="44"
        height="22"
        rx="4"
        strokeWidth="1.25"
        stroke="currentColor"
      />

      {/* Top right card */}
      <rect
        x="118"
        y="22"
        width="98"
        height="40"
        rx="5"
        strokeWidth="1.25"
        stroke="currentColor"
      />
      <line
        x1="128"
        y1="36"
        x2="192"
        y2="36"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />
      <line
        x1="128"
        y1="46"
        x2="170"
        y2="46"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />

      {/* Bottom right card */}
      <rect
        x="118"
        y="72"
        width="98"
        height="38"
        rx="5"
        strokeWidth="1.25"
        stroke="currentColor"
      />
      <line
        x1="128"
        y1="84"
        x2="192"
        y2="84"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />
      <line
        x1="128"
        y1="94"
        x2="174"
        y2="94"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />
    </svg>
  );
}

/**
 * 3. ISOLATE: MicroVM sandboxes network
 * Central server/microVM node connected to 4 satellite sandboxes via dashed routes with port nodes.
 */
export function WireframeIsolate() {
  return (
    <svg
      viewBox="0 0 240 130"
      className="w-full max-w-[240px] h-auto text-zinc-500 select-none overflow-visible"
      fill="none"
      stroke="currentColor"
    >
      {/* Top-Left Satellite */}
      <rect
        x="20"
        y="14"
        width="46"
        height="38"
        rx="5"
        strokeWidth="1.25"
        stroke="currentColor"
      />
      <line
        x1="28"
        y1="26"
        x2="56"
        y2="26"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />
      <line
        x1="28"
        y1="34"
        x2="50"
        y2="34"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />

      {/* Bottom-Left Satellite */}
      <rect
        x="20"
        y="78"
        width="46"
        height="38"
        rx="5"
        strokeWidth="1.25"
        stroke="currentColor"
      />
      <line
        x1="28"
        y1="90"
        x2="56"
        y2="90"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />
      <line
        x1="28"
        y1="98"
        x2="50"
        y2="98"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />

      {/* Top-Right Satellite */}
      <rect
        x="174"
        y="14"
        width="46"
        height="38"
        rx="5"
        strokeWidth="1.25"
        stroke="currentColor"
      />
      <line
        x1="182"
        y1="26"
        x2="210"
        y2="26"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />
      <line
        x1="182"
        y1="34"
        x2="204"
        y2="34"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />

      {/* Bottom-Right Satellite */}
      <rect
        x="174"
        y="78"
        width="46"
        height="38"
        rx="5"
        strokeWidth="1.25"
        stroke="currentColor"
      />
      <line
        x1="182"
        y1="90"
        x2="210"
        y2="90"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />
      <line
        x1="182"
        y1="98"
        x2="204"
        y2="98"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />

      {/* Center MicroVM Node */}
      <rect
        x="98"
        y="42"
        width="44"
        height="46"
        rx="5"
        strokeWidth="1.25"
        stroke="currentColor"
      />
      <line
        x1="106"
        y1="72"
        x2="134"
        y2="72"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />

      {/* Dashed connector lines + endpoint dots */}
      {/* Top-Left to Center */}
      <line
        x1="66"
        y1="33"
        x2="98"
        y2="54"
        strokeWidth="1.2"
        strokeDasharray="3 3"
        stroke="currentColor"
      />
      <circle cx="66" cy="33" r="2.5" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="98" cy="54" r="2.5" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.25" />

      {/* Bottom-Left to Center */}
      <line
        x1="66"
        y1="97"
        x2="98"
        y2="76"
        strokeWidth="1.2"
        strokeDasharray="3 3"
        stroke="currentColor"
      />
      <circle cx="66" cy="97" r="2.5" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="98" cy="76" r="2.5" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.25" />

      {/* Top-Right to Center */}
      <line
        x1="174"
        y1="33"
        x2="142"
        y2="54"
        strokeWidth="1.2"
        strokeDasharray="3 3"
        stroke="currentColor"
      />
      <circle cx="174" cy="33" r="2.5" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="142" cy="54" r="2.5" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.25" />

      {/* Bottom-Right to Center */}
      <line
        x1="174"
        y1="97"
        x2="142"
        y2="76"
        strokeWidth="1.2"
        strokeDasharray="3 3"
        stroke="currentColor"
      />
      <circle cx="174" cy="97" r="2.5" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="142" cy="76" r="2.5" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

/**
 * 4. ENFORCE: Eval regression curve & assertion
 * Baseline, step threshold sigmoid curve, and milestone dots (clean without cursor pointer).
 */
export function WireframeEnforce() {
  return (
    <svg
      viewBox="0 0 240 130"
      className="w-full max-w-[240px] h-auto text-zinc-500 select-none overflow-visible"
      fill="none"
      stroke="currentColor"
    >
      {/* Top-left pill badge */}
      <rect
        x="12"
        y="14"
        width="82"
        height="20"
        rx="10"
        strokeWidth="1.25"
        stroke="currentColor"
      />
      <line
        x1="24"
        y1="24"
        x2="78"
        y2="24"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />

      {/* Baseline */}
      <line
        x1="10"
        y1="106"
        x2="230"
        y2="106"
        strokeWidth="1.25"
        strokeLinecap="round"
        stroke="currentColor"
      />

      {/* S-curve (sigmoid step function) */}
      <path
        d="M 28 106 C 58 106 62 60 92 60 L 210 60"
        strokeWidth="1.5"
        strokeLinecap="round"
        stroke="currentColor"
      />

      {/* Data / milestone points */}
      <circle cx="56" cy="106" r="3" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="92" cy="60" r="3" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="128" cy="60" r="3" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="164" cy="60" r="3" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
