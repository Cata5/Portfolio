"use client";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { GlassCard } from "@/components/glass-card";
import { Stagger } from "@/components/motion/stagger";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";

export function Stack() {
  const { content } = useEditor();
  const skillGroups = content.skills.skillGroups;

  return (
    <Section id="stack" eyebrow="Stack" className="relative overflow-hidden">
      <GlassCard className="p-6 sm:p-10 lg:p-14">
        <TextReveal
          as="h2"
          className="mb-16 text-3xl font-normal tracking-[-0.02em] md:text-4xl"
        >
          Technologies &amp; Tools
        </TextReveal>
        <Stagger
          className="grid gap-x-14 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
          stagger={0.07}
        >
          {skillGroups.map((group, gIdx) => (
            <div key={group.label || gIdx}>
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <Editable path={`skills.skillGroups.${gIdx}.label`} label="Group Name" inline>
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
                    {group.label}
                  </h3>
                </Editable>
                <Editable path={`skills.skillGroups.${gIdx}.note`} label="Group Note" inline>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {group.note}
                  </span>
                </Editable>
              </div>
              <Editable
                path={`skills.skillGroups.${gIdx}.items`}
                label={`${group.label} items`}
                type="array"
              >
                <ul className="grid grid-cols-2 gap-x-6">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="group flex items-center gap-3 py-[9px]"
                    >
                      <span
                        className="size-1 shrink-0 bg-signal/40 transition-colors group-hover:bg-signal"
                        aria-hidden="true"
                      />
                      <span className="text-[15px] font-light text-foreground/85 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </Editable>
            </div>
          ))}
        </Stagger>
      </GlassCard>
    </Section>
  );
}
