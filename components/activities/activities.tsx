"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { GlassCard } from "@/components/glass-card";
import { Stagger } from "@/components/motion/stagger";
import { TextReveal } from "@/components/motion/text-reveal";
import { Section } from "@/components/section";
import type { Activity } from "@/data/activities";
import { cn } from "@/lib/utils";

const typeColor: Record<string, string> = {
  Hackathon: "text-signal border-signal/30",
  Event: "text-saffron border-saffron/30",
  Competition: "text-foreground/70 border-border/60",
};

function ActivityCard({
  activity,
  index,
}: {
  activity: Activity;
  index: number;
}) {
  const inner = (
    <>
      {activity.image && (
        <div className="relative h-44 w-full overflow-hidden sm:h-52">
          <Image
            src={activity.image}
            alt={`${activity.title} — photo`}
            fill
            sizes="(min-width: 640px) 44vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <span
            className={cn(
              "absolute right-4 top-4 rounded-full border bg-background/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] backdrop-blur-sm",
              typeColor[activity.type] ?? typeColor.Competition,
            )}
          >
            {activity.type}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        {!activity.image && (
          <span
            className={cn(
              "mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em]",
              typeColor[activity.type] ?? typeColor.Competition,
            )}
          >
            {activity.type}
          </span>
        )}
        <p className="font-mono text-[11px] text-muted-foreground">
          {activity.year}
          <span className="mx-1.5 opacity-40">·</span>
          {activity.location}
        </p>
        <h3 className="mt-2 text-xl font-normal tracking-[-0.02em] transition-colors duration-200 group-hover:text-signal">
          {activity.title}
        </h3>
        <p className="mt-3 text-[15px] font-extralight leading-relaxed text-muted-foreground">
          {activity.description}
        </p>
        {activity.link && (
          <a
            href={activity.link}
            target="_blank"
            rel="noreferrer"
            aria-label={`View more about ${activity.title}`}
            className="group/link mt-5 inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-signal"
          >
            View more
            <ArrowUpRight
              className="size-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        )}
      </div>
    </>
  );

  return (
    <li className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-muted/20 transition-colors duration-300 hover:border-border">
      <Editable
        path={`activities.${index}`}
        label={`Activity: ${activity.title}`}
        type="activity"
        value={activity}
      >
        {inner}
      </Editable>
    </li>
  );
}

export function Activities() {
  const { content } = useEditor();
  const activities = content.activities;

  return (
    <Section id="activities" eyebrow="Activities">
      <GlassCard className="p-6 sm:p-10 lg:p-14">
        <TextReveal
          as="h2"
          className="mb-14 text-3xl font-normal tracking-[-0.02em] md:text-4xl"
        >
          Things I show up for
        </TextReveal>
        <Stagger
          as="ul"
          className="grid gap-6 sm:grid-cols-2 lg:gap-8"
          stagger={0.07}
        >
          {activities.map((activity, idx) => (
            <ActivityCard key={activity.id || idx} activity={activity} index={idx} />
          ))}
        </Stagger>
      </GlassCard>
    </Section>
  );
}
