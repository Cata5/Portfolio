"use client";

import Image from "next/image";

import { Parallax } from "@/components/motion/parallax";
import { ScrollScale } from "@/components/motion/scroll-scale";
import { Stagger } from "@/components/motion/stagger";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";
import { projects } from "@/data/projects";
import type { Project } from "@/data/projects";

const mobileApps = projects.filter(
  (p) => p.category === "Android" || p.category === "iOS",
);

function PhoneScreen({ project }: { project: Project }) {
  const src = project.image ?? project.screenshots?.[0] ?? null;
  if (!project.placeholder && src) {
    return (
      <Image
        src={src}
        alt={`${project.title} — screenshot`}
        fill
        sizes="260px"
        className="object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent 0 14px, color-mix(in srgb, var(--border) 30%, transparent) 14px 15px)",
      }}
    >
      <p className="px-8 text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground">
        {project.placeholder ? "placeholder app" : "screenshot pending"}
      </p>
    </div>
  );
}

function PhoneFrame({ project }: { project: Project }) {
  return (
    <figure className="w-[220px] transition-transform duration-300 ease-out hover:-translate-y-2 sm:w-[248px]">
      <div className="relative aspect-[9/19] rounded-[2.2rem] bg-foreground/5 p-2">
        <div
          className="absolute left-1/2 top-[1.35rem] z-10 h-[1.3rem] w-24 -translate-x-1/2 rounded-full bg-foreground/15"
          aria-hidden="true"
        />
        <div className="relative h-full w-full overflow-hidden rounded-[1.7rem] bg-foreground/5">
          <PhoneScreen project={project} />
        </div>
      </div>
      <figcaption className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {project.title} — {project.category.toLowerCase()}
      </figcaption>
    </figure>
  );
}

export function Apps() {
  if (mobileApps.length === 0) return null;

  return (
    <Section id="apps" eyebrow="Apps">
      <TextReveal
        as="h2"
        className="mb-16 text-3xl font-normal tracking-[-0.02em] md:text-4xl"
      >
        Mobile work
      </TextReveal>
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Stagger as="div" className="flex flex-col justify-center gap-10">
            {mobileApps.map((app) => (
              <div key={app.id}>
                <p className="text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
                  {app.category}
                  {app.year ? ` — ${app.year}` : ""}
                </p>
                <h3 className="mt-3 text-3xl font-normal tracking-[-0.02em]">
                  {app.title}
                </h3>
                {app.placeholder && (
                  <p className="mt-2 font-mono text-[11px] text-signal">
                    placeholder — replace in data/projects.ts
                  </p>
                )}
                <p className="mt-4 max-w-sm text-lg font-extralight leading-relaxed text-muted-foreground">
                  {app.summary}
                </p>
                {app.technologies.length > 0 && (
                  <p className="mt-5 font-mono text-[12px] text-muted-foreground">
                    {app.technologies.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </Stagger>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:col-span-7 lg:gap-12">
          {mobileApps.map((app, i) => (
            <ScrollScale key={app.id}>
              <Parallax speed={i % 2 === 0 ? 0.05 : -0.05}>
                <PhoneFrame project={app} />
              </Parallax>
            </ScrollScale>
          ))}
        </div>
      </div>
    </Section>
  );
}
