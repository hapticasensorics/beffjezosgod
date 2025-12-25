"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceInterfaceProps {
  onTranscript: (text: string) => void;
  onListeningChange: (isListening: boolean) => void;
  disabled?: boolean;
}

// Types are declared in types/speech.d.ts

export default function VoiceInterface({
  onTranscript,
  onListeningChange,
  disabled = false,
}: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    if (
      typeof window !== "undefined" &&
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || disabled) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (final) {
        onTranscript(final);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      onListeningChange(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChange(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    onListeningChange(true);
  }, [isSupported, disabled, onTranscript, onListeningChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // Handle push-to-talk (mousedown/mouseup, touchstart/touchend)
  const handlePressStart = () => {
    if (!disabled) startListening();
  };

  const handlePressEnd = () => {
    stopListening();
  };

  if (!isSupported) {
    return (
      <div className="text-center p-4">
        <p className="text-terminal-green/60 text-sm">
          Voice input not supported in this browser.
          <br />
          Try Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Push-to-talk button */}
      <button
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        disabled={disabled}
        className={`
          relative w-20 h-20 rounded-full border-2 transition-all duration-200
          ${
            isListening
              ? "border-terminal-green bg-terminal-green/20 scale-110"
              : "border-terminal-green/50 bg-transparent hover:border-terminal-green"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer btn-glow"}
        `}
      >
        {/* Microphone icon */}
        <svg
          viewBox="0 0 24 24"
          className={`w-8 h-8 mx-auto transition-all ${
            isListening ? "text-terminal-green" : "text-terminal-green/70"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>

        {/* Pulsing ring when listening */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-2 border-terminal-green animate-ping opacity-50" />
        )}
      </button>

      {/* Instructions */}
      <p className="text-xs text-terminal-green/50 tracking-wide">
        {isListening ? "LISTENING..." : "HOLD TO SPEAK"}
      </p>

      {/* Interim transcript preview */}
      {interimTranscript && (
        <p className="text-sm text-terminal-green/70 italic max-w-xs text-center">
          &quot;{interimTranscript}&quot;
        </p>
      )}
    </div>
  );
}
