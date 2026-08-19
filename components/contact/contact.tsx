"use client";

import { ArrowUpRight } from "lucide-react";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { GlassCard } from "@/components/glass-card";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";

export function Contact() {
  const { content } = useEditor();
  const { site, copy } = content;

  return (
    <Section id="contact" eyebrow="Contact">
      <GlassCard className="p-6 sm:p-10 lg:max-w-[40rem] lg:p-14">
        <div className="max-w-3xl">
          <Editable path="copy.contact.heading" label="Contact Heading" type="textarea">
            <TextReveal
              as="h2"
              className="text-[clamp(2.5rem,7vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.03em]"
            >
              {copy.contact?.heading ?? "Have a problem worth building for?"}
            </TextReveal>
          </Editable>
          <Reveal delay={0.15}>
            <Editable path="copy.contact.description" label="Contact Description" type="textarea">
              <p className="mt-8 max-w-lg text-lg font-extralight leading-relaxed text-muted-foreground">
                {copy.contact?.description ??
                  "I read everything. Write to me about work, experiments, or an idea that doesn't fit anywhere else."}
              </p>
            </Editable>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-12">
              <Magnetic>
                <Editable path="site.email" label="Contact Email" inline>
                  <a
                    href={`mailto:${site.email}`}
                    className="group inline-flex items-baseline gap-3 font-mono text-xl tracking-tight text-saffron transition-colors hover:text-foreground md:text-3xl"
                  >
                    {site.email}
                    <ArrowUpRight className="size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </Editable>
              </Magnetic>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px] text-muted-foreground">
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
                <span aria-hidden="true">·</span>
                <span>
                  currently building {site.currently.project.toLowerCase()}
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </GlassCard>
    </Section>
  );
}
