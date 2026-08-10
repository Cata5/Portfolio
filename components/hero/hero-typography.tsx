import { site } from "@/data/site";

/**
 * The poster headline — "SOFTWARE / DEVELOPER" split into two giant lines,
 * each rising from behind an overflow mask on load (animated in hero.tsx).
 * Static markup stays fully visible without JS or for reduced motion.
 *
 * The eyebrow carries the identity; the lines are the visual object.
 */
export function HeroTypography() {
  return (
    <>
      <p className="hero-eyebrow mb-8 overflow-hidden text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
        <span className="hero-eyebrow-inner block">
          {site.name} — {site.role}
        </span>
      </p>

      <h1 className="hero-title text-[clamp(3rem,12.5vw,8.5rem)] font-light leading-[0.86] tracking-[-0.035em] text-foreground">
        <span className="hero-line-mask block overflow-hidden pb-[0.06em]">
          <span className="hero-line block">
            SOFTWARE
            <span
              aria-hidden="true"
              className="ml-[0.28em] inline-block size-[0.24em] translate-y-[-0.04em] bg-saffron"
            />
          </span>
        </span>
        <span className="hero-line-mask block overflow-hidden pl-[0.42em] pb-[0.04em]">
          <span className="hero-line block text-foreground/85">
            DEVELOPER
          </span>
        </span>
      </h1>
    </>
  );
}
