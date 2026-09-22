import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/container";
import { MotesField } from "@/components/motes-field";
import { PageReveal } from "@/components/motion/page-reveal";
import { Reveal } from "@/components/motion/reveal";
import { ScrollScale } from "@/components/motion/scroll-scale";
import { TextReveal } from "@/components/motion/text-reveal";
import { ProjectVisual } from "@/components/project-visual";
import { ScreenshotGallery } from "@/components/projects/screenshot-gallery";
import { limitationsWithSource, sourceAvailability } from "@/data/project-extras";
import { site } from "@/data/site";
import {
  getProject,
  getRelatedProjects,
  realProjects,
} from "@/data/projects";

export function generateStaticParams() {
  return realProjects.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project || project.placeholder) return {};
  return {
    title: project.title,
    description: project.summary,
    alternates: {
      canonical: `${site.url}/projects/${slug}/`,
    },
    openGraph: {
      type: "article",
      url: `${site.url}/projects/${slug}/`,
      title: project.title,
      description: project.summary,
      // Page-level openGraph replaces the layout's, so the shared og.png
      // must be repeated here (same treatment as app/layout.tsx).
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: `${site.name} — ${site.role}`,
        },
      ],
    },
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="min-w-0 text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron md:col-span-3">
      {children}
    </h2>
  );
}

function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-20 grid gap-8 border-t border-border/40 pt-16 md:grid-cols-12 md:gap-10">
      <SectionLabel>{label}</SectionLabel>
      {/* min-w-0 keeps wide children (architecture <pre>) from blowing out the grid */}
      <div className="min-w-0 md:col-span-7">{children}</div>
    </section>
  );
}

function FeatureList({
  items,
  marker,
}: {
  items: string[];
  marker: "check" | "half" | "open";
}) {
  const markerEl =
    marker === "check" ? (
      <span className="mt-[9px] size-1 shrink-0 bg-signal" />
    ) : marker === "half" ? (
      <span className="mt-[6px] inline-flex h-[9px] w-[9px] shrink-0 items-center justify-center border border-signal/70 text-[8px] leading-none text-signal">
        ◐
      </span>
    ) : (
      <span className="mt-[6px] inline-flex h-[9px] w-[9px] shrink-0 items-center justify-center border border-border/70 text-[8px] leading-none text-muted-foreground">
        ○
      </span>
    );
  return (
    <ul className="space-y-2.5">
      {items.map((f) => (
        <li
          key={f}
          className="flex items-start gap-3 text-[14.5px] leading-relaxed text-foreground/85"
        >
          {markerEl}
          {f}
        </li>
      ))}
    </ul>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project || project.placeholder) notFound();

  const index = realProjects.findIndex((p) => p.id === project.id);
  const prev = realProjects[index - 1] ?? null;
  const next = realProjects[index + 1] ?? null;
  const related = getRelatedProjects(project.id);
  return (
    <>
      {/* Detail pages don't carry the full TriangleWorld scene — just the
          ambient motes, so the page still breathes with the triangle
          material instead of sitting on a flat background. */}
      <MotesField />
      <Container className="relative z-10 pb-24 pt-10 md:pb-32 md:pt-14">
        <PageReveal>
        <Link
          href="/#work"
          className="group inline-flex items-center gap-2 font-mono text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          all work
        </Link>

        <header className="mt-16 max-w-3xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
            {project.category}
            {project.year ? ` — ${project.year}` : ""}
          </p>
          <TextReveal
            as="h1"
            play="load"
            delay={0.05}
            className="mt-5 text-5xl font-normal leading-[0.98] tracking-[-0.03em] md:text-7xl"
          >
            {project.title}
          </TextReveal>
          <p className="mt-8 text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
            {project.summary}
          </p>
          {(project.github || project.demo) && (
            <div className="mt-8 flex flex-wrap gap-6">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-signal"
                >
                  GitHub
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-signal"
                >
                  Live demo
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              )}
            </div>
          )}
        </header>

        <div className="mt-14">
          <ScrollScale>
            <ProjectVisual
              project={project}
              contain
              className="aspect-[16/9]"
            />
          </ScrollScale>
        </div>

        {project.description && (
          <DetailSection label="Overview">
            <p className="max-w-prose text-[15px] leading-relaxed text-foreground/85">
              {project.description}
            </p>
          </DetailSection>
        )}

        <DetailSection label="At a glance">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Role
              </dt>
              <dd className="mt-1.5 text-[14.5px] font-medium">Developer</dd>
            </div>
            {project.platform && (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Platform
                </dt>
                <dd className="mt-1.5 text-[14.5px] font-medium">
                  {project.platform}
                </dd>
              </div>
            )}
            {project.year && (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Year
                </dt>
                <dd className="mt-1.5 text-[14.5px] font-medium">
                  {project.year}
                </dd>
              </div>
            )}
            <div className="col-span-2 sm:col-span-1">
              <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Status
              </dt>
              <dd className="mt-1.5 text-[14.5px] font-medium">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-1.5 rounded-full bg-signal"
                    aria-hidden="true"
                  />
                  {project.status}
                </span>
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Technologies
              </dt>
              <dd className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
                {project.technologies.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[12px] text-foreground/80"
                  >
                    {t}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </DetailSection>

        {project.features && project.features.length > 0 && (
          <DetailSection label="Features">
            <FeatureList items={project.features} marker="check" />
          </DetailSection>
        )}

        {project.partialFeatures && project.partialFeatures.length > 0 && (
          <DetailSection label="Partial">
            <FeatureList items={project.partialFeatures} marker="half" />
          </DetailSection>
        )}

        {project.plannedFeatures && project.plannedFeatures.length > 0 && (
          <DetailSection label="Planned">
            <FeatureList items={project.plannedFeatures} marker="open" />
          </DetailSection>
        )}

        {project.architecture && (
          <DetailSection label="Architecture">
            <p className="max-w-prose text-[14.5px] leading-relaxed text-foreground/85">
              {project.architecture}
            </p>
            {project.architectureDiagram && (
              <Reveal y={18}>
                <pre className="mt-6 overflow-x-auto border border-border/60 bg-muted/30 p-5 font-mono text-[12px] leading-relaxed text-foreground/75">
                  {project.architectureDiagram}
                </pre>
              </Reveal>
            )}
          </DetailSection>
        )}

        {project.challenges && project.challenges.length > 0 && (
          <DetailSection label="Challenges">
            <div className="space-y-6">
              {project.challenges.map((c) => (
                <div key={c.problem}>
                  <p className="text-[14px] font-medium text-foreground/90">
                    {c.problem}
                  </p>
                  <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-muted-foreground">
                    {c.solution}
                  </p>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {project.learned && project.learned.length > 0 && (
          <DetailSection label="What I learned">
            <FeatureList items={project.learned} marker="check" />
          </DetailSection>
        )}

        {project.limitations && project.limitations.length > 0 && (
          <DetailSection label="Known limitations">
            <FeatureList items={limitationsWithSource(project)} marker="half" />
          </DetailSection>
        )}
        {!project.limitations && sourceAvailability[project.id] && (
          <DetailSection label="Known limitations">
            <FeatureList items={[sourceAvailability[project.id]!]} marker="half" />
          </DetailSection>
        )}

        {project.futureWork && project.futureWork.length > 0 && (
          <DetailSection label="Future work">
            <FeatureList items={project.futureWork} marker="open" />
          </DetailSection>
        )}

        {project.screenshots && project.screenshots.length > 0 && (
          <DetailSection label="Screenshots">
            <ScreenshotGallery project={project} />
          </DetailSection>
        )}

        {related.length > 0 && (
          <DetailSection label="Related">
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="group flex flex-col justify-between gap-6 border-t border-border/40 pt-6 transition-colors"
                >
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {p.category}
                      {p.year ? ` · ${p.year}` : ""}
                    </p>
                    <p className="mt-2 text-[18px] font-normal transition-colors group-hover:text-signal">
                      {p.title}
                    </p>
                  </div>
                  <p className="text-[14px] font-light leading-relaxed text-muted-foreground">
                    {p.summary}
                  </p>
                </Link>
              ))}
            </div>
          </DetailSection>
        )}

        <nav
          aria-label="Project navigation"
          className="mt-24 grid gap-4 border-t border-border/40 pt-10 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
        >
          {prev ? (
            <Link
              href={`/projects/${prev.id}`}
              className="group inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-signal"
            >
              <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
              <span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  previous
                </span>
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          <Link
            href="/#work"
            className="order-last inline-flex items-center justify-center gap-2 font-mono text-[12px] text-muted-foreground transition-colors hover:text-foreground sm:order-none"
          >
            <ArrowLeft className="size-4" />
            all work
          </Link>
          {next ? (
            <Link
              href={`/projects/${next.id}`}
              className="group inline-flex items-center justify-end gap-2 text-right text-sm font-medium transition-colors hover:text-signal"
            >
              <span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  next
                </span>
                {next.title}
              </span>
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
        </PageReveal>
      </Container>
    </>
  );
}
