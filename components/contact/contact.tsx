import { ArrowUpRight } from "lucide-react";

import { GlassCard } from "@/components/glass-card";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";
import { site } from "@/data/site";

export function Contact() {
  return (
    <Section id="contact" eyebrow="Contact">
      {/* Left-aligned and narrower on desktop so the final black-hole form
          (which owns the right side of the canvas) shows beside the copy
          instead of hiding behind the panel. */}
      <GlassCard className="p-6 sm:p-10 lg:max-w-[40rem] lg:p-14">
        <div className="max-w-3xl">
          <TextReveal
            as="h2"
            className="text-[clamp(2.5rem,7vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.03em]"
          >
            Have a problem worth building for?
          </TextReveal>
          <Reveal delay={0.15}>
            <p className="mt-8 max-w-lg text-lg font-extralight leading-relaxed text-muted-foreground">
              I read everything. Write to me about work, experiments, or an
              idea that doesn&apos;t fit anywhere else.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-12">
              <Magnetic>
                <a
                  href={`mailto:${site.email}`}
                  className="group inline-flex items-baseline gap-3 font-mono text-xl tracking-tight text-saffron transition-colors hover:text-foreground md:text-3xl"
                >
                  {site.email}
                  <ArrowUpRight className="size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </Magnetic>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px] text-muted-foreground">
                <a
                  href={site.github}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  GitHub ↗
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  LinkedIn ↗
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href={site.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Instagram ↗
                </a>
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
