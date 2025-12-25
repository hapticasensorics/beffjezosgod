"use client";

import { useState, useCallback, useRef } from "react";
import Terminal from "@/components/Terminal";
import Portrait from "@/components/Portrait";
import VoiceInterface from "@/components/VoiceInterface";
import Transcript from "@/components/Transcript";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript.trim() || isLoading) return;

      // Add user message
      const userMessage: Message = { role: "user", content: transcript };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Get AI response from Groq
        const chatResponse = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: transcript,
            history: messages,
          }),
        });

        if (!chatResponse.ok) throw new Error("Chat request failed");

        const { response } = await chatResponse.json();

        // Add assistant message
        const assistantMessage: Message = { role: "assistant", content: response };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);

        // Get TTS audio
        const speakResponse = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: response }),
        });

        if (!speakResponse.ok) throw new Error("TTS request failed");

        // Play the audio
        const audioBlob = await speakResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          console.error("Audio playback error");
        };

        await audio.play();
      } catch (error) {
        console.error("Error:", error);
        setIsLoading(false);
        setIsSpeaking(false);

        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "The connection to the oracle has been disrupted. Try again.",
          },
        ]);
      }
    },
    [messages, isLoading]
  );

  const handleListeningChange = useCallback((listening: boolean) => {
    setIsListening(listening);
  }, []);

  return (
    <main className="min-h-screen bg-terminal-dark">
      <Terminal>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-green/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-terminal-green/50 tracking-widest">
            ORACLE TERMINAL v1.0
          </span>
          <div className="w-16" /> {/* Spacer for symmetry */}
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left side - Portrait */}
          <div className="md:w-1/3 flex items-center justify-center border-b md:border-b-0 md:border-r border-terminal-green/20">
            <Portrait isSpeaking={isSpeaking} />
          </div>

          {/* Right side - Transcript + Voice */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Transcript */}
            <Transcript messages={messages} isTyping={isLoading} />

            {/* Voice interface */}
            <div className="border-t border-terminal-green/20">
              <VoiceInterface
                onTranscript={handleTranscript}
                onListeningChange={handleListeningChange}
                disabled={isLoading || isSpeaking}
              />
            </div>
          </div>
        </div>

        {/* Footer status bar */}
        <div className="flex items-center justify-between px-4 py-1 border-t border-terminal-green/20 text-xs text-terminal-green/40">
          <span>
            {isListening
              ? "RECEIVING TRANSMISSION..."
              : isSpeaking
                ? "ORACLE SPEAKING..."
                : isLoading
                  ? "PROCESSING..."
                  : "AWAITING INPUT"}
          </span>
          <span>GPT-4.1 + TTS</span>
        </div>
      </Terminal>
    </main>
  );
}
