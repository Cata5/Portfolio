"use client";

import { ArrowUpRight } from "lucide-react";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { GlassCard } from "@/components/glass-card";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";
import { ContactForm } from "@/components/contact/contact-form";

export function Contact() {
  const { content } = useEditor();
  const { site, copy } = content;

  return (
    <Section id="contact" eyebrow="Contact">
      <GlassCard className="w-full max-w-5xl p-6 sm:p-10 lg:p-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Heading, Info, Direct Links */}
          <div className="flex flex-col justify-between lg:col-span-5">
            <div>
              <Editable path="copy.contact.heading" label="Contact Heading" type="textarea">
                <TextReveal
                  as="h2"
                  className="text-[clamp(2.2rem,5vw,3.5rem)] font-normal leading-[1.04] tracking-[-0.03em]"
                >
                  {copy.contact?.heading ?? "Have a problem worth building for?"}
                </TextReveal>
              </Editable>
              <Reveal delay={0.15}>
                <Editable path="copy.contact.description" label="Contact Description" type="textarea">
                  <p className="mt-6 max-w-md text-base font-light leading-relaxed text-muted-foreground">
                    {copy.contact?.description ??
                      "I read everything. Write to me about work, experiments, or an idea that doesn't fit anywhere else."}
                  </p>
                </Editable>
              </Reveal>
            </div>

            <Reveal delay={0.25}>
              <div className="mt-10 lg:mt-12 space-y-6">
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                    Email
                  </span>
                  <Magnetic>
                    <Editable path="site.email" label="Contact Email" inline>
                      <a
                        href={`mailto:${site.email}`}
                        className="group inline-flex items-baseline gap-2 font-mono text-lg tracking-tight text-saffron transition-colors hover:text-foreground md:text-2xl"
                      >
                        {site.email}
                        <ArrowUpRight className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </Editable>
                  </Magnetic>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[12px] text-muted-foreground border-t border-border/40 pt-4">
                  <Editable path="site.github" label="GitHub URL" inline>
                    <a
                      href={site.github}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-foreground"
                    >
                      GitHub ↗
                    </a>
                  </Editable>
                  <span aria-hidden="true">·</span>
                  <Editable path="site.linkedin" label="LinkedIn URL" inline>
                    <a
                      href={site.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-foreground"
                    >
                      LinkedIn ↗
                    </a>
                  </Editable>
                  <span aria-hidden="true">·</span>
                  <Editable path="site.instagram" label="Instagram URL" inline>
                    <a
                      href={site.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-foreground"
                    >
                      Instagram ↗
                    </a>
                  </Editable>
                </div>

                <div className="font-mono text-[11px] text-muted-foreground/60">
                  currently building {site.currently.project.toLowerCase()}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7 flex flex-col justify-center border-t border-border/30 pt-8 lg:border-t-0 lg:border-l lg:border-border/40 lg:pt-0 lg:pl-12">
            <Reveal delay={0.2}>
              <div className="mb-4">
                <span className="font-mono text-xs uppercase tracking-wider text-saffron/90 font-medium">
                  Send a message
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Send a note directly to my inbox.
                </p>
              </div>
              <ContactForm recipientEmail={site.email} />
            </Reveal>
          </div>
        </div>
      </GlassCard>
    </Section>
  );
}

