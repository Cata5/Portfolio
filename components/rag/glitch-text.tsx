"use client";

import { useState, useEffect, useCallback } from "react";

const GLITCH_CHARS = "01X#%&*§/\\∆λ_+=?><";

interface GlitchTextProps {
  text: string;
  className?: string;
  speed?: number;
  periodicTwitch?: boolean;
  onComplete?: () => void;
}

export function GlitchText({
  text,
  className = "",
  speed = 25,
  periodicTwitch = false,
  onComplete,
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [isDone, setIsDone] = useState(false);

  const runDecode = useCallback(() => {
    let iteration = 0;
    setIsDone(false);

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (char === " " || char === "\n") return char;
            if (index < iteration) {
              return text[index];
            }
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
        setIsDone(true);
        onComplete?.();
      }

      iteration += 1 / 2;
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  useEffect(() => {
    const cleanup = runDecode();
    return cleanup;
  }, [runDecode]);

  // Occasional random single-character twitch after decode completes
  useEffect(() => {
    if (!periodicTwitch || !isDone || text.length === 0) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const randIdx = Math.floor(Math.random() * text.length);
        if (text[randIdx] !== " " && text[randIdx] !== "\n") {
          const chars = text.split("");
          chars[randIdx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          setDisplayText(chars.join(""));
          setTimeout(() => {
            setDisplayText(text);
          }, 80);
        }
      }
    }, 2400);

    return () => clearInterval(interval);
  }, [periodicTwitch, isDone, text]);

  return <span className={className}>{displayText || text}</span>;
}
