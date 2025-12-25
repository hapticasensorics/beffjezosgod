"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TranscriptProps {
  messages: Message[];
  isTyping?: boolean;
}

function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 30); // 30ms per character

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayedText}
      {!isComplete && <span className="cursor-blink">_</span>}
    </span>
  );
}

export default function Transcript({ messages, isTyping }: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-terminal-green/40 text-sm text-center">
          Hold the microphone to commune with the oracle...
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
    >
      {messages.map((msg, index) => {
        const isLatestAssistant =
          msg.role === "assistant" && index === messages.length - 1;

        return (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-terminal-green/10 border border-terminal-green/30"
                  : "bg-transparent"
              }`}
            >
              {msg.role === "user" ? (
                <>
                  <span className="text-xs text-terminal-green/50 block mb-1">
                    YOU
                  </span>
                  <p className="text-terminal-green/80 text-sm">{msg.content}</p>
                </>
              ) : (
                <>
                  <span className="text-xs text-terminal-green/50 block mb-1">
                    BEFF JEZOS
                  </span>
                  <p className="terminal-text text-sm leading-relaxed">
                    {isLatestAssistant ? (
                      <TypewriterText text={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex justify-start">
          <div className="px-3 py-2">
            <span className="text-xs text-terminal-green/50 block mb-1">
              BEFF JEZOS
            </span>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-terminal-green rounded-full animate-bounce" />
              <span
                className="w-2 h-2 bg-terminal-green rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <span
                className="w-2 h-2 bg-terminal-green rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
