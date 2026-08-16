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
      <p className="hero-eyebrow mb-4 sm:mb-6 lg:mb-8 overflow-hidden text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
        <span className="hero-eyebrow-inner block">
          {site.name} — {site.role}
        </span>
      </p>

      <h1 className="hero-title text-[clamp(2.3rem,6vw,3.2rem)] sm:text-[clamp(2.8rem,5.5vw,3.8rem)] md:text-[clamp(3.2rem,4.6vw,4.4rem)] lg:text-[clamp(3.8rem,4.5vw,5.2rem)] xl:text-[clamp(4.2rem,4.6vw,5.8rem)] font-light leading-[0.92] tracking-[-0.035em] text-foreground">
        <span className="hero-line-mask block overflow-hidden pb-[0.06em]">
          <span className="hero-line block whitespace-nowrap">
            STUDENT
            <span
              aria-hidden="true"
              className="ml-[0.24em] inline-block size-[0.22em] translate-y-[-0.04em] bg-saffron"
            />
          </span>
        </span>
        <span className="hero-line-mask block overflow-hidden pl-[0.18em] sm:pl-[0.24em] pb-[0.04em]">
          <span className="hero-line block whitespace-nowrap text-foreground/85">
            DEVELOPER
          </span>
        </span>
      </h1>
    </>
  );
}
