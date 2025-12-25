"use client";

import { ReactNode } from "react";

interface TerminalProps {
  children: ReactNode;
}

export default function Terminal({ children }: TerminalProps) {
  return (
    <div className="relative w-full h-screen bg-terminal-dark flex items-center justify-center p-4 md:p-8">
      {/* Outer frame - industrial/metallic look */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-3xl p-3 md:p-6 shadow-2xl">
        {/* Metal screws in corners */}
        <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-zinc-600 shadow-inner" />
        <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-zinc-600 shadow-inner" />
        <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-zinc-600 shadow-inner" />
        <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-zinc-600 shadow-inner" />

        {/* Inner bezel */}
        <div className="relative w-full h-full bg-black rounded-2xl p-2 shadow-inner">
          {/* Screen */}
          <div className="relative w-full h-full bg-terminal-dark rounded-xl overflow-hidden crt-curve crt-flicker">
            {/* CRT Effects */}
            <div className="crt-scanlines" />
            <div className="crt-scanline-moving" />
            <div className="crt-vignette" />

            {/* Content */}
            <div className="relative z-20 w-full h-full flex flex-col">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Power LED */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-terminal-green shadow-lg shadow-terminal-green/50 animate-pulse" />
        <span className="text-xs text-zinc-500 uppercase tracking-widest">
          Online
        </span>
      </div>
    </div>
  );
}
