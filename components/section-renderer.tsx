"use client";

import { useMemo } from "react";
import { About } from "@/components/about/about";
import { Activities } from "@/components/activities/activities";
import { Certifications } from "@/components/certifications/certifications";
import { Contact } from "@/components/contact/contact";
import { Hero } from "@/components/hero/hero";
import { Journey } from "@/components/journey/journey";
import { MLNotebook } from "@/components/ml/ml-notebook";
import { FeaturedProjects } from "@/components/projects/featured-projects";
import { ProjectExplorer } from "@/components/projects/project-explorer";
import { Stack } from "@/components/stack/stack";
import { Section } from "@/components/section";
import { GlassCard } from "@/components/glass-card";
import { TextReveal } from "@/components/motion/text-reveal";
import { useEditor } from "@/components/editor/editor-context";
import type { PageSection } from "@/data/sections";

function CustomSectionCard({ section }: { section: PageSection }) {
  const eyebrow = section.settings?.eyebrow || section.name;
  const title = section.settings?.title || section.name;
  const body = section.settings?.body || section.settings?.content || "Custom section content configured via admin.";

  return (
    <Section id={section.id} eyebrow={eyebrow}>
      <GlassCard className="p-6 sm:p-10 lg:p-14">
        <TextReveal
          as="h2"
          className="mb-8 text-3xl font-normal tracking-[-0.02em] md:text-4xl text-foreground"
        >
          {title}
        </TextReveal>
        <p className="max-w-2xl font-extralight text-base sm:text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {body}
        </p>
      </GlassCard>
    </Section>
  );
}

export function SectionRenderer() {
  const { content } = useEditor();
  const sections = content.sections || [];

  const activeSections = useMemo(
    () => sections.filter((s) => s.enabled),
    [sections],
  );

  return (
    <div className="relative z-10 flex flex-col">
      {activeSections.map((sec, idx) => {
        switch (sec.type) {
          case "hero":
            return <Hero key={sec.id || idx} />;
          case "about":
            return <About key={sec.id || idx} />;
          case "featured-projects":
            return <FeaturedProjects key={sec.id || idx} />;
          case "projects":
            return <ProjectExplorer key={sec.id || idx} />;
          case "stack":
            return <Stack key={sec.id || idx} />;
          case "certifications":
            return <Certifications key={sec.id || idx} />;
          case "ml":
            return <MLNotebook key={sec.id || idx} />;
          case "journey":
            return <Journey key={sec.id || idx} />;
          case "activities":
            return <Activities key={sec.id || idx} />;
          case "contact":
            return <Contact key={sec.id || idx} />;
          case "custom":
            return <CustomSectionCard key={sec.id || idx} section={sec} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
