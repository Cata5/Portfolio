"use client";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";

export function HeroTypography() {
  const { content } = useEditor();
  const { site, copy } = content;

  return (
    <>
      <p className="hero-eyebrow mb-4 sm:mb-6 lg:mb-8 overflow-hidden text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
        <span className="hero-eyebrow-inner block">
          <Editable path="site.role" label="Role / Title" inline>
            {site.name} — {site.role}
          </Editable>
        </span>
      </p>

      <h1 className="hero-title text-[clamp(2.3rem,6vw,3.2rem)] sm:text-[clamp(2.8rem,5.5vw,3.8rem)] md:text-[clamp(3.2rem,4.6vw,4.4rem)] lg:text-[clamp(3.8rem,4.5vw,5.2rem)] xl:text-[clamp(4.2rem,4.6vw,5.8rem)] font-light leading-[0.92] tracking-[-0.035em] text-foreground">
        <span className="hero-line-mask block overflow-hidden pb-[0.06em]">
          <span className="hero-line block whitespace-nowrap">
            <Editable path="copy.hero.word1" label="Hero Word 1" inline>
              {copy.hero?.word1 ?? "SYSTEMS &"}
            </Editable>
            <span
              aria-hidden="true"
              className="ml-[0.24em] inline-block size-[0.22em] translate-y-[-0.04em] bg-saffron"
            />
          </span>
        </span>
        <span className="hero-line-mask block overflow-hidden pl-[0.18em] sm:pl-[0.24em] pb-[0.04em]">
          <span className="hero-line block whitespace-nowrap text-foreground/85">
            <Editable path="copy.hero.word2" label="Hero Word 2" inline>
              {copy.hero?.word2 ?? "APPLICATIONS"}
            </Editable>
          </span>
        </span>
      </h1>
    </>
  );
}

