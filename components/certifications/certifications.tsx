import { Download, ExternalLink } from "lucide-react";
import Image from "next/image";

import { GlassCard } from "@/components/glass-card";
import { Stagger } from "@/components/motion/stagger";
import { TextReveal } from "@/components/motion/text-reveal";
import { Section } from "@/components/section";
import { certifications } from "@/data/certifications";
import { withBasePath } from "@/lib/base-path";

/**
 * Certifications — the earned-paper shelf. Each card shows a crisp WebP
 * poster render of the certificate (whole document, nothing clipped); the
 * poster itself opens the real PDF in a new tab, and the header keeps
 * open/download actions for readers without a PDF viewer. Follows the same
 * frosted-glass recipe as every other section.
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
            <li
              key={cert.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-muted/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-signal/40 hover:bg-muted/30 hover:shadow-[0_18px_50px_-24px_rgba(128,82,255,0.4)]"
            >
              <div className="flex items-start justify-between gap-4 p-6 pb-5 sm:p-7 sm:pb-5">
                <div className="min-w-0">
                  <h3 className="text-xl font-normal tracking-[-0.02em] transition-colors duration-200 group-hover:text-signal">
                    {cert.title}
                  </h3>
                  <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                    {cert.issuer}
                    <span className="mx-1.5 opacity-40">·</span>
                    {cert.year}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={withBasePath(cert.file)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 p-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-signal"
                    aria-label={`Open ${cert.title} certificate in a new tab`}
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                  <a
                    href={withBasePath(cert.file)}
                    download
                    className="inline-flex items-center gap-1.5 p-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-signal"
                    aria-label={`Download ${cert.title} certificate`}
                  >
                    <Download className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Poster — object-contain so the whole document is always
                  visible (CCNA is 3:2, IC3 4:3); the frame clips nothing. */}
              <div className="relative mx-6 aspect-[4/3] overflow-hidden rounded-xl border border-border/60 bg-muted/30 sm:mx-7">
                <a
                  href={withBasePath(cert.file)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${cert.title} certificate`}
                  className="absolute inset-0"
                >
                  <Image
                    src={cert.poster}
                    alt={`${cert.title} — ${cert.subtitle} certificate`}
                    fill
                    sizes="(min-width: 768px) 40vw, 100vw"
                    className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <span
                    className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/45 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    <span className="mb-4 inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-foreground/90 px-3 py-1.5 font-mono text-[11px] text-background transition-transform duration-300 group-hover:translate-y-0">
                      Open certificate
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </span>
                  </span>
                </a>
              </div>

              <ul className="flex flex-wrap gap-1.5 p-6 pt-4 sm:p-7 sm:pt-4">
                {cert.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-border/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </Stagger>
      </GlassCard>
    </Section>
  );
}
