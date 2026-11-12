"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import type {
  RoadmapChatSample,
  RoadmapChatSection,
} from "@/data/roadmap";
import { cn } from "@/lib/utils";

/**
 * Interactive chat sample viewer for CataAI v3 on /projects/llm-from-scratch.
 * Displays real prompt/response pairs recorded from chat_ro.py.
 */
export function ChatSamples({
  samples,
  copy,
}: {
  samples: RoadmapChatSample[];
  copy: RoadmapChatSection;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduced = useReducedMotion();

  const active = samples[activeIndex] ?? samples[0];
  if (!active) return null;

  return (
    <section
      id="chat-samples"
      className="mt-20 scroll-mt-32 border-t border-border/40 pt-16"
    >
      <div className="md:grid md:grid-cols-12 md:gap-10">
        <h2 className="min-w-0 text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron md:col-span-3">
          {copy.label}
        </h2>

        <div className="min-w-0 md:col-span-9">
          <p className="max-w-3xl text-[17px] font-light leading-relaxed text-foreground/90 md:text-[18px]">
            {copy.title}
          </p>
          <p className="mt-4 max-w-3xl text-[14.5px] leading-relaxed text-muted-foreground">
            {copy.intro}
          </p>

          {(copy.modelBadge || copy.decodingBadge) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {copy.modelBadge && (
                <span className="border border-signal/35 bg-signal/[0.06] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-signal">
                  {copy.modelBadge}
                </span>
              )}
              {copy.decodingBadge && (
                <span className="border border-border/50 bg-muted/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {copy.decodingBadge}
                </span>
              )}
            </div>
          )}

          {/* Topic tabs */}
          <div
            role="tablist"
            aria-label="CataAI chat samples"
            className="mt-8 flex flex-wrap gap-2"
          >
            {samples.map((sample, i) => {
              const selected = i === activeIndex;
              return (
                <button
                  key={sample.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "border px-3 py-2 text-left transition-colors",
                    selected
                      ? "border-signal/60 bg-signal/[0.08] text-foreground"
                      : "border-border/50 bg-background/40 text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                    <span className={selected ? "text-signal" : "text-muted-foreground/70"}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{sample.topic}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active transcript */}
          <motion.div
            key={active.id}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-5 overflow-hidden border border-border/50 bg-black/85"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-2.5">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="size-1.5 rounded-full bg-signal/70" />
                <span className="size-1.5 rounded-full bg-saffron/60" />
                <span className="size-1.5 rounded-full bg-border" />
                <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  chat_ro.py · {active.topic}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                Romanian · ChatML
              </span>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 border border-saffron/40 bg-saffron/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-saffron">
                  Tu
                </span>
                <p className="text-[14.5px] font-medium leading-relaxed text-foreground/95">
                  {active.prompt}
                </p>
              </div>

              <div className="flex items-start gap-3 border-t border-border/30 pt-5">
                <span className="mt-0.5 shrink-0 border border-signal/45 bg-signal/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-signal">
                  CataAI
                </span>
                <p className="text-[14.5px] font-light leading-[1.7] text-foreground/85">
                  {active.response}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

