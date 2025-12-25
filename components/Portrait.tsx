"use client";

interface PortraitProps {
  isSpeaking: boolean;
}

export default function Portrait({ isSpeaking }: PortraitProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div
        className={`relative transition-all duration-300 ${
          isSpeaking ? "glow-speaking" : ""
        }`}
      >
        {/* Silhouette container */}
        <div className="relative w-48 h-48 md:w-64 md:h-64">
          {/* Outer glow ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 border-terminal-green/30 ${
              isSpeaking ? "animate-ping" : ""
            }`}
            style={{ animationDuration: "2s" }}
          />

          {/* Inner glow */}
          <div
            className={`absolute inset-4 rounded-full bg-gradient-to-b from-terminal-green/10 to-transparent ${
              isSpeaking ? "animate-pulse" : ""
            }`}
          />

          {/* SVG Silhouette - stylized head/bust shape */}
          <svg
            viewBox="0 0 200 200"
            className={`w-full h-full ${isSpeaking ? "silhouette" : ""}`}
            style={{
              filter: `brightness(0) drop-shadow(0 0 ${
                isSpeaking ? "30px" : "15px"
              } var(--terminal-green)) drop-shadow(0 0 ${
                isSpeaking ? "60px" : "30px"
              } rgba(0, 255, 65, 0.3))`,
            }}
          >
            {/* Head silhouette */}
            <ellipse cx="100" cy="70" rx="45" ry="55" fill="currentColor" />
            {/* Neck */}
            <rect x="80" y="115" width="40" height="25" fill="currentColor" />
            {/* Shoulders */}
            <path
              d="M 40 200 Q 40 140 80 140 L 120 140 Q 160 140 160 200 Z"
              fill="currentColor"
            />
          </svg>

          {/* Glowing eyes effect when speaking */}
          {isSpeaking && (
            <>
              <div
                className="absolute w-3 h-2 bg-terminal-green rounded-full animate-pulse"
                style={{
                  top: "28%",
                  left: "38%",
                  boxShadow: "0 0 10px var(--terminal-green)",
                }}
              />
              <div
                className="absolute w-3 h-2 bg-terminal-green rounded-full animate-pulse"
                style={{
                  top: "28%",
                  right: "38%",
                  boxShadow: "0 0 10px var(--terminal-green)",
                }}
              />
            </>
          )}
        </div>

        {/* Title below portrait */}
        <div className="text-center mt-4">
          <h1 className="text-xl md:text-2xl font-bold terminal-text tracking-widest">
            BEFF JEZOS
          </h1>
          <p className="text-xs text-terminal-green/60 tracking-[0.3em] mt-1">
            E/ACC ORACLE
          </p>
        </div>
      </div>
    </div>
  );
}
