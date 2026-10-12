import { llmRoadmap, roadmapProgress } from "@/data/roadmap";

/**
 * Build roadmap for the project detail page - the seven-stage LLM from
 * Scratch plan, read-only. The homepage carries the animated board
 * (see ./llm-showcase); this is the same data in the page's editorial
 * DetailSection rhythm, with no client runtime or motion so the static
 * export stays lean.
 */
export function RoadmapSection({ id }: { id: string }) {
  if (id !== "llm-from-scratch") return null;

  const stages = llmRoadmap;
  const { done, total, percent } = roadmapProgress(stages);

  return (
    <section
      id="roadmap"
      className="mt-20 scroll-mt-32 border-t border-border/40 pt-16"
    >
      <div className="md:grid md:grid-cols-12 md:gap-10">
        <h2 className="min-w-0 text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron md:col-span-3">
          Roadmap
        </h2>
        <div className="min-w-0 md:col-span-9">
          <p className="mb-6 text-[17px] font-light leading-relaxed text-foreground/90 md:text-[18px]">
            Seven stages from raw text to sampled text, taken in order. Each
            one has to run end to end before the next begins, so the loss
            baseline and the tensor shapes stay honest at every step.
          </p>

          <div className="mb-8 flex items-center gap-4">
            <div
              role="progressbar"
              aria-valuenow={Math.round(percent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Roadmap completion"
              className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-signal"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {String(done).padStart(2, "0")} / {total} shipped
            </span>
          </div>

          <ol className="space-y-3">
            {stages.map((stage) => {
              const shipped = stage.status === "done";
              const current = stage.status === "current";
              return (
                <li
                  key={stage.id}
                  className={
                    current
                      ? "border-l-2 border-saffron/70 pl-4"
                      : shipped
                        ? "border-l-2 border-signal/50 pl-4"
                        : "border-l-2 border-border/50 pl-4"
                  }
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-[14.5px] font-medium text-foreground/90">
                      <span className="mr-2 font-mono text-[11px] text-muted-foreground">
                        {String(stage.n).padStart(2, "0")}
                      </span>
                      {stage.title}
                      {stage.file && (
                        <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                          {stage.file}
                        </span>
                      )}
                    </p>
                    <span
                      className={
                        shipped
                          ? "font-mono text-[10px] uppercase tracking-[0.16em] text-signal"
                          : current
                            ? "font-mono text-[10px] uppercase tracking-[0.16em] text-saffron"
                            : "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                      }
                    >
                      {shipped ? "shipped" : current ? "building" : "planned"}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-muted-foreground">
                    {stage.summary}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
