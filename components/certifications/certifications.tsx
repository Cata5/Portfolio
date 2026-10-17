"use client";

import { Award, CheckCircle2, Download, ExternalLink } from "lucide-react";
import Image from "next/image";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { GlassCard } from "@/components/glass-card";
import { Stagger } from "@/components/motion/stagger";
import { TextReveal } from "@/components/motion/text-reveal";
import { Section } from "@/components/section";
import { withBasePath } from "@/lib/base-path";

export function Certifications() {
  const { content } = useEditor();
  const certifications = content.certifications;
  const certCopy = content.copy?.certifications as Record<string, string> | undefined;
  const eyebrow = certCopy?.eyebrow || "Certifications";
  const title = certCopy?.title || "Certifications";

  return (
    <Section id="certifications" eyebrow={eyebrow}>
      <GlassCard className="p-6 sm:p-10 lg:p-14">
        <Editable path="copy.certifications.title" label="Certifications Title">
          <TextReveal
            as="h2"
            className="mb-14 text-3xl font-normal tracking-[-0.02em] md:text-4xl"
          >
            {title}
          </TextReveal>
        </Editable>
        <Stagger
          as="ul"
          className="grid gap-8 md:grid-cols-2"
          stagger={0.08}
        >
          {certifications.map((cert, idx) => {
            const hasPoster = Boolean(cert.poster && cert.poster.trim() !== "");
            const hasFile = Boolean(cert.file && cert.file.trim() !== "");

            return (
              <li
                key={cert.id || idx}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-muted/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-signal/40 hover:bg-muted/30 hover:shadow-[0_18px_50px_-24px_rgba(128,82,255,0.4)]"
              >
                <Editable
                  path={`certifications.${idx}`}
                  label={`Cert: ${cert.title}`}
                  type="cert"
                  value={cert}
                >
                  <div className="flex h-full flex-col">
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
                      <div className="flex shrink-0 items-center gap-1.5">
                        {hasFile ? (
                          <>
                            <a
                              href={withBasePath(cert.file!)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 p-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-signal"
                              aria-label={`Open ${cert.title} certificate in a new tab`}
                            >
                              <ExternalLink className="size-3.5" aria-hidden="true" />
                            </a>
                            <a
                              href={withBasePath(cert.file!)}
                              download
                              className="inline-flex items-center gap-1.5 p-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-signal"
                              aria-label={`Download ${cert.title} certificate`}
                            >
                              <Download className="size-3.5" aria-hidden="true" />
                            </a>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-signal/30 bg-signal/10 px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-signal">
                            <CheckCircle2 className="size-3" aria-hidden="true" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative mx-6 aspect-[4/3] overflow-hidden rounded-xl border border-border/60 bg-muted/30 sm:mx-7">
                      {hasPoster ? (
                        hasFile ? (
                          <a
                            href={withBasePath(cert.file!)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${cert.title} certificate`}
                            className="absolute inset-0 block"
                          >
                            <Image
                              src={cert.poster!}
                              alt={`${cert.title} - ${cert.subtitle} certificate`}
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
                        ) : (
                          <Image
                            src={cert.poster!}
                            alt={`${cert.title} - ${cert.subtitle} certificate`}
                            fill
                            sizes="(min-width: 768px) 40vw, 100vw"
                            className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          />
                        )
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none bg-gradient-to-br from-signal/[0.07] via-muted/20 to-background/80">
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(128,82,255,0.12),transparent_70%)]" />
                          <div className="relative mb-3 flex size-14 items-center justify-center rounded-2xl border border-signal/30 bg-signal/10 shadow-[0_0_25px_-5px_rgba(128,82,255,0.3)] transition-transform duration-500 group-hover:scale-105">
                            <Award className="size-7 text-signal" aria-hidden="true" />
                          </div>
                          <span className="relative font-mono text-[11px] uppercase tracking-widest text-signal font-semibold">
                            {cert.issuer || "Accreditation"}
                          </span>
                          <h4 className="relative mt-1 text-base font-medium tracking-tight text-foreground line-clamp-2 max-w-[240px]">
                            {cert.title}
                          </h4>
                          {cert.subtitle && (
                            <p className="relative mt-1 font-mono text-[11px] text-muted-foreground line-clamp-1">
                              {cert.subtitle}
                            </p>
                          )}
                          <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
                            <CheckCircle2 className="size-3 text-signal" aria-hidden="true" />
                            <span>Coursework Completed · {cert.year}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <ul className="flex flex-wrap gap-1.5 p-6 pt-4 sm:p-7 sm:pt-4 mt-auto">
                      {cert.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-border/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Editable>
              </li>
            );
          })}
        </Stagger>
      </GlassCard>
    </Section>
  );
}
