"use client";

import { useState, useEffect } from "react";
import { isGhPages } from "@/lib/base-path";

export type OfflineStyle = "holographic" | "cyberpunk" | "cyberdeck" | "search";

export function useGlitchMode() {
  const [isSimulated, setIsSimulated] = useState(false);
  const [offlineStyle, setOfflineStyleState] = useState<OfflineStyle>("holographic");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedSim = typeof window !== "undefined" ? localStorage.getItem("rag_simulate_glitch_mode") : null;
    setIsSimulated(storedSim === "true");

    const storedStyle = typeof window !== "undefined" ? (localStorage.getItem("rag_offline_style") as OfflineStyle) : null;
    if (storedStyle && ["holographic", "cyberpunk", "cyberdeck", "search"].includes(storedStyle)) {
      setOfflineStyleState(storedStyle);
    }

    const handleStorage = () => {
      if (typeof window !== "undefined") {
        setIsSimulated(localStorage.getItem("rag_simulate_glitch_mode") === "true");
        const s = localStorage.getItem("rag_offline_style") as OfflineStyle;
        if (s && ["holographic", "cyberpunk", "cyberdeck", "search"].includes(s)) {
          setOfflineStyleState(s);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("rag_glitch_mode_change", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("rag_glitch_mode_change", handleStorage);
    };
  }, []);

  const toggleGlitchMode = (val?: boolean) => {
    const next = val !== undefined ? val : !isSimulated;
    setIsSimulated(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("rag_simulate_glitch_mode", next ? "true" : "false");
      window.dispatchEvent(new Event("rag_glitch_mode_change"));
    }
  };

  const setOfflineStyle = (style: OfflineStyle) => {
    setOfflineStyleState(style);
    if (typeof window !== "undefined") {
      localStorage.setItem("rag_offline_style", style);
      window.dispatchEvent(new Event("rag_glitch_mode_change"));
    }
  };

  // Glitch mode is active if explicitly simulated in admin or running in GitHub Pages static deploy
  const isGlitchActive = mounted && (isSimulated || isGhPages);

  return {
    isGlitchActive,
    isSimulated,
    offlineStyle,
    setOfflineStyle,
    toggleGlitchMode,
    mounted,
  };
}
