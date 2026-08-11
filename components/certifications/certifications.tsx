import { Download, ExternalLink } from "lucide-react";

import { GlassCard } from "@/components/glass-card";
import { Reveal } from "@/components/motion/reveal";
import { Stagger } from "@/components/motion/stagger";
import { TextReveal } from "@/components/motion/text-reveal";
import { Section } from "@/components/section";
import { certifications } from "@/data/certifications";

/**
 * Certifications — the earned-paper shelf. Each certificate renders inline
 * through the browser's native PDF viewer (no plugin), with an open-in-tab
 * and download fallback for readers whose browser lacks one. Follows the
 * same frosted-glass recipe as every other section so the persistent
 * triangle material reads through behind the documents.
 */
export function Certifications() {
  return (
    <Section id="certifications" eyebrow="Certifications">
      <GlassCard className="p-6 sm:p-10 lg:p-14">
        <TextReveal
          as="h2"
          className="mb-14 text-3xl font-normal tracking-[-0.02em] md:text-4xl"
        >
          Certifications
        </TextReveal>
        <Stagger
          as="ul"
          className="grid gap-8 md:grid-cols-2"
          stagger={0.08}
        >
          {certifications.map((cert) => (
            <li key={cert.id}>
              <div className="flex items-baseline justify-between gap-4 pb-4">
                <div>
                  <h3 className="text-xl font-normal tracking-[-0.02em]">
                    {cert.title}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {cert.subtitle}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={cert.file}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 p-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-signal"
                    aria-label={`Open ${cert.title} certificate in a new tab`}
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                  <a
                    href={cert.file}
                    download
                    className="inline-flex items-center gap-1.5 p-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-signal"
                    aria-label={`Download ${cert.title} certificate`}
                  >
                    <Download className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
              <Reveal y={14}>
                {/* Both certificate PDFs are landscape documents (930×630 and
                    792×612), so the viewer frame is landscape too — a portrait
                    frame would letterbox the page with large side margins. */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                  <iframe
                    src={cert.file}
                    title={`${cert.title} certificate`}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                  />
                </div>
              </Reveal>
            </li>
          ))}
        </Stagger>
      </GlassCard>
    </Section>
  );
}
