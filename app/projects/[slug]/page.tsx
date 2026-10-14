import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/container";
import { MotesField } from "@/components/motes-field";
import { PageReveal } from "@/components/motion/page-reveal";
import { Reveal } from "@/components/motion/reveal";
import { ScrollScale } from "@/components/motion/scroll-scale";
import { TextReveal } from "@/components/motion/text-reveal";
import { ProjectVisual } from "@/components/project-visual";
import { MediaBand } from "@/components/projects/media-band";
import { RoadmapSection } from "@/components/projects/roadmap-section";
import { RunComparison } from "@/components/projects/run-comparison";
import { ScreenshotGallery } from "@/components/projects/screenshot-gallery";
import {
  SectionNav,
  type SectionAnchor,
} from "@/components/projects/section-nav";
import { limitationsWithSource, sourceAvailability } from "@/data/project-extras";
import { llmRuns, llmRunsSection } from "@/data/roadmap";
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
          alt: `${site.name} - ${site.role}`,
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
  id,
  label,
  children,
  intro,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
  /** Optional larger lead sentence under the label — editorial hierarchy. */
  intro?: string;
}) {
  return (
    <section
      id={id}
      className="mt-20 scroll-mt-32 border-t border-border/40 pt-16 md:grid md:grid-cols-12 md:gap-10"
    >
      <SectionLabel>{label}</SectionLabel>
      <div className="min-w-0 md:col-span-7">
        {intro && (
          <p className="mb-6 text-[17px] font-light leading-relaxed text-foreground/90 md:text-[18px]">
            {intro}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

function MetaItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 text-[13.5px] font-medium text-foreground/90">
        {children}
      </dd>
    </div>
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

/** Hero uses `image`; bands pull unused screenshots so the page breathes. */
function pickBands(project: {
  image: string | null;
  screenshots?: string[];
}): string[] {
  const shots = project.screenshots ?? [];
  const hero = project.image;
  const rest = shots.filter((s) => s !== hero);
  // Prefer up to two mid-page bands; leave the rest for the gallery.
  return rest.slice(0, 2);
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

  const bands = pickBands(project);
  const shots = project.screenshots ?? [];

  const sections: SectionAnchor[] = [];
  if (project.description) sections.push({ id: "overview", label: "Overview" });
  if (project.id === "llm-from-scratch") {
    sections.push({ id: "roadmap", label: "Roadmap" });
    if (llmRuns.length > 0) {
      sections.push({ id: "runs", label: llmRunsSection.navLabel });
    }
  }
  sections.push({ id: "features", label: "Features" });
  if (project.architecture) {
    sections.push({ id: "architecture", label: "Architecture" });
  }
  const limitationItems = project.limitations
    ? limitationsWithSource(project)
    : sourceAvailability[project.id]
      ? [sourceAvailability[project.id]!]
      : null;
  if (limitationItems?.length || project.futureWork?.length) {
    sections.push({ id: "notes", label: "Notes" });
  }
  if (shots.length > 0) {
    sections.push({ id: "screenshots", label: "Screenshots" });
  }
  if (related.length > 0) {
    sections.push({ id: "related", label: "Related" });
  }

  const hasFeatureLists =
    (project.features?.length ?? 0) > 0 ||
    (project.partialFeatures?.length ?? 0) > 0 ||
    (project.plannedFeatures?.length ?? 0) > 0;

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

          {/* ---- Hero -------------------------------------------------- */}
          <header className="mt-14 md:mt-20">
            <p className="text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
              {project.category}
              {project.year ? ` - ${project.year}` : ""}
            </p>
            <TextReveal
              as="h1"
              play="load"
              delay={0.05}
              className="mt-5 max-w-4xl text-5xl font-normal leading-[0.96] tracking-[-0.035em] md:text-7xl md:leading-[0.95] lg:text-[5.5rem]"
            >
              {project.title}
            </TextReveal>
            <p className="mt-7 max-w-2xl text-lg font-light leading-[1.55] text-muted-foreground md:mt-9 md:text-xl md:leading-[1.5]">
              {project.summary}
            </p>

            {/* Meta strip — role / platform / year / status / stack */}
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-6 border-y border-border/40 py-6">
              <MetaItem label="Role">Developer</MetaItem>
              {project.platform && (
                <MetaItem label="Platform">{project.platform}</MetaItem>
              )}
              {project.year && (
                <MetaItem label="Year">{project.year}</MetaItem>
              )}
              <MetaItem label="Status">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-1.5 rounded-full bg-signal"
                    aria-hidden="true"
                  />
                  {project.status}
                </span>
              </MetaItem>
              <div className="min-w-0 basis-full sm:basis-auto">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Stack
                </dt>
                <dd className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
                  {project.technologies.map((t) => (
                    <span
                      key={t}
                      className="font-mono text-[12px] text-foreground/75"
                    >
                      {t}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>

            {(project.github || project.demo) && (
              <div className="mt-7 flex flex-wrap gap-6">
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

          {/* Hero visual — near full container, the page's opening plate */}
          <div className="mt-12 md:mt-16">
            <ScrollScale>
              <div className="relative overflow-hidden border border-border/30 bg-muted/10">
                <ProjectVisual
                  project={project}
                  contain
                  className="aspect-[16/10] sm:aspect-[16/9] lg:aspect-[2/1]"
                />
                {/* Soft bottom scrim so the plate sits into the page */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/40 to-transparent"
                />
              </div>
            </ScrollScale>
          </div>

          <SectionNav sections={sections} />

          {/* ---- Overview (editorial lede) ----------------------------- */}
          {project.description && (
            <section id="overview" className="mt-16 scroll-mt-32 md:mt-20">
              <div className="md:grid md:grid-cols-12 md:gap-10">
                <SectionLabel>Overview</SectionLabel>
                <div className="min-w-0 md:col-span-9">
                  <p className="max-w-3xl text-[18px] font-light leading-[1.65] text-foreground/90 md:text-[21px] md:leading-[1.6]">
                    {project.description}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ---- Roadmap (LLM from Scratch) ---------------------------- */}
          <RoadmapSection id={project.id} />

          {/* ---- Recorded training runs (LLM from Scratch) ----------- */}
          {project.id === "llm-from-scratch" && llmRuns.length > 0 && (
            <RunComparison runs={llmRuns} copy={llmRunsSection} />
          )}

          {bands[0] && (
            <MediaBand
              src={bands[0]}
              alt={`${project.title} - interface detail`}
            />
          )}

          {/* ---- Features ---------------------------------------------- */}
          {hasFeatureLists && (
            <section id="features" className="mt-20 scroll-mt-32 border-t border-border/40 pt-16 md:grid md:grid-cols-12 md:gap-10">
              <SectionLabel>Features</SectionLabel>
              <div className="min-w-0 space-y-12 md:col-span-9">
                {project.features && project.features.length > 0 && (
                  <div>
                    <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Shipping · {project.features.length}
                    </p>
                    <FeatureList items={project.features} marker="check" />
                  </div>
                )}
                {project.partialFeatures &&
                  project.partialFeatures.length > 0 && (
                    <div>
                      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Partial · {project.partialFeatures.length}
                      </p>
                      <FeatureList
                        items={project.partialFeatures}
                        marker="half"
                      />
                    </div>
                  )}
                {project.plannedFeatures &&
                  project.plannedFeatures.length > 0 && (
                    <div>
                      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Planned · {project.plannedFeatures.length}
                      </p>
                      <FeatureList
                        items={project.plannedFeatures}
                        marker="open"
                      />
                    </div>
                  )}
              </div>
            </section>
          )}

          {bands[1] && (
            <MediaBand
              src={bands[1]}
              alt={`${project.title} - another view`}
            />
          )}

          {/* ---- Architecture ------------------------------------------ */}
          {project.architecture && (
            <DetailSection
              id="architecture"
              label="Architecture"
              intro={project.architecture}
            >
              {project.architectureDiagram && (
                <Reveal y={18}>
                  <div className="mt-2 overflow-hidden border border-border/50 bg-muted/25">
                    <div
                      aria-hidden="true"
                      className="flex items-center gap-1.5 border-b border-border/40 px-4 py-2.5"
                    >
                      <span className="size-1.5 rounded-full bg-signal/60" />
                      <span className="size-1.5 rounded-full bg-saffron/50" />
                      <span className="size-1.5 rounded-full bg-border" />
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        system map
                      </span>
                    </div>
                    <pre className="overflow-x-auto p-5 font-mono text-[12px] leading-relaxed text-foreground/80 sm:p-6">
                      {project.architectureDiagram}
                    </pre>
                  </div>
                </Reveal>
              )}
            </DetailSection>
          )}

          {project.challenges && project.challenges.length > 0 && (
            <DetailSection label="Challenges">
              <div className="space-y-7">
                {project.challenges.map((c) => (
                  <div
                    key={c.problem}
                    className="border-l-2 border-signal/40 pl-4"
                  >
                    <p className="text-[14.5px] font-medium text-foreground/90">
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

          {/* ---- Honest notes: limitations + future -------------------- */}
          {(limitationItems?.length || project.futureWork?.length) && (
            <section
              id="notes"
              className="mt-20 scroll-mt-32 border-t border-border/40 pt-16"
            >
              <div className="md:grid md:grid-cols-12 md:gap-10">
                <SectionLabel>Notes</SectionLabel>
                <div className="min-w-0 grid gap-10 md:col-span-9 sm:grid-cols-2">
                  {limitationItems && limitationItems.length > 0 && (
                    <div>
                      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Known limitations
                      </p>
                      <FeatureList items={limitationItems} marker="half" />
                    </div>
                  )}
                  {project.futureWork && project.futureWork.length > 0 && (
                    <div>
                      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Future work
                      </p>
                      <FeatureList items={project.futureWork} marker="open" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ---- Screenshots ------------------------------------------- */}
          {shots.length > 0 && (
            <section
              id="screenshots"
              className="mt-20 scroll-mt-32 border-t border-border/40 pt-16 md:grid md:grid-cols-12 md:gap-10"
            >
              <SectionLabel>Screenshots</SectionLabel>
              <div className="min-w-0 md:col-span-9">
                <ScreenshotGallery project={project} />
              </div>
            </section>
          )}

          {/* ---- Related ------------------------------------------------ */}
          {related.length > 0 && (
            <section
              id="related"
              className="mt-20 scroll-mt-32 border-t border-border/40 pt-16 md:grid md:grid-cols-12 md:gap-10"
            >
              <SectionLabel>Related</SectionLabel>
              <div className="min-w-0 md:col-span-9">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="group flex flex-col overflow-hidden border border-border/40 bg-card/20 transition-colors hover:border-foreground/20"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted/20">
                        {p.image || p.screenshots?.[0] ? (
                          <Image
                            src={p.image ?? p.screenshots![0]}
                            alt={p.title}
                            fill
                            sizes="(min-width: 640px) 30vw, 100vw"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div
                            aria-hidden="true"
                            className="h-full w-full"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(45deg, transparent 0 16px, color-mix(in srgb, var(--border) 30%, transparent) 16px 17px)",
                            }}
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          {p.category}
                          {p.year ? ` · ${p.year}` : ""}
                        </p>
                        <p className="text-[16px] font-normal transition-colors group-hover:text-signal">
                          {p.title}
                        </p>
                        <p className="mt-auto pt-2 text-[13px] font-light leading-relaxed text-muted-foreground line-clamp-3">
                          {p.summary}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ---- Pager -------------------------------------------------- */}
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
