import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Zoah exact palette tokens
        zoah: {
          bg: "#0b0b0a",
          stage: "#0f0f0e",
          card: "#141413",
          cardHover: "#1b1b19",
          border: "#2a2a28",
          borderSubtle: "#1f1f1d",
          muted: "#8f8f8d",
          ink: "#f3f3f1",
          accent: "#3b76ff",
          surfaceHover: "#26262a",
        },
        // AgentGarage status colors
        status: {
          observed: "#3b76ff",
          predicted: "#8f8f8d",
          verified: "#ef4444",
          protected: "#f59e0b",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "dash-flow": {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "-24" },
        },
        "dash-flow-reverse": {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "24" },
        },
        "dash-march": {
          "0%": { backgroundPosition: "0 100%" },
          "100%": { backgroundPosition: "16px 100%" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "caret-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "beam-spin": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "dash-flow": "dash-flow 1.2s linear infinite",
        "dash-flow-reverse": "dash-flow-reverse 1.2s linear infinite",
        "dash-march": "dash-march 1s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "caret-blink": "caret-blink 1s steps(2) infinite",
        "beam-spin": "beam-spin 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
