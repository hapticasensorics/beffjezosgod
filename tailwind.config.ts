import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          green: "#00ff41",
          amber: "#ffb000",
          dark: "#0a0a0a",
          glow: "#00ff4180",
        },
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        flicker: "flicker 0.15s infinite",
        scanline: "scanline 8s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": {
            boxShadow: "0 0 20px #00ff4140, 0 0 40px #00ff4120",
          },
          "50%": {
            boxShadow: "0 0 40px #00ff4180, 0 0 80px #00ff4140",
          },
        },
        flicker: {
          "0%": { opacity: "0.97" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.98" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
