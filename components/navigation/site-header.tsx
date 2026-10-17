"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { gsap } from "@/components/motion/gsap";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { RAGTrigger } from "@/components/rag/rag-trigger";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { scrollToId } from "@/components/motion/lenis";


// cmdk + the dialog primitives stay out of the initial bundle — the palette
// is a power-user shortcut, not first paint. Width-matched placeholder avoids
// header layout shift while the chunk loads.
const CommandMenu = dynamic(
  () =>
    import("@/components/navigation/command-menu").then((m) => m.CommandMenu),
  {
    ssr: false,
    loading: () => (
      <span
        aria-hidden="true"
        className="hidden h-6 w-[43px] sm:inline-block"
      />
    ),
  },
);

import { useEditor } from "@/components/editor/editor-context";
import { buildNavLinks } from "@/lib/nav-links";

export function SiteHeader() {
  const { content } = useEditor();
  const [active, setActive] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "" || pathname.endsWith("/Portfolio/");
  const currentActive = isHome ? active : null;

  // buildNavLinks falls back to hardcoded defaults, so the nav can never go
  // empty even if a CMS save strips navLabel from content/sections.json.
  const links = buildNavLinks(content?.sections);

  // Section highlighting (only on homepage)
  useEffect(() => {
    if (!isHome) return;
    const ids = links.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [isHome, JSON.stringify(links.map((l) => l.href))]);

  // Entrance reveal.
  useIsomorphicLayoutEffect(() => {
    const header = headerRef.current;
    if (!header || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-header-inner]",
        { y: -18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: EASE.out, delay: 0.15 },
      );
    }, header);
    return () => ctx.revert();
  }, []);



  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 w-full pt-3 px-3.5 pb-1 md:p-0 bg-transparent md:bg-background/80 md:backdrop-blur-sm pointer-events-none md:pointer-events-auto transition-[background-color,backdrop-filter] duration-200"
    >
      <div
        data-header-inner
        className={cn(
          "pointer-events-auto mx-auto flex h-12 w-full max-w-[540px] items-center justify-between px-3.5 sm:px-4",
          "rounded-full border border-border/60 bg-background/70 backdrop-blur-xl",
          "shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-black/60 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] dark:ring-1 dark:ring-white/10",
          "md:h-16 md:max-w-[1120px] md:rounded-none md:border-0 md:bg-transparent md:backdrop-blur-none md:shadow-none md:ring-0 md:px-8",
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={isHome ? "#top" : "/"}
            onClick={(e) => {
              if (isHome) {
                e.preventDefault();
                scrollToId("top");
              }
            }}
            className="flex items-center"
            aria-label={`${site.name} - back to top`}
          >
            <span className="text-[14px] md:text-[15px] font-semibold tracking-[-0.01em] whitespace-nowrap">
              {site.name}
            </span>
          </Link>

          {/* Active section micro-pill indicator on mobile */}
          {currentActive && (
            <span
              className="hidden min-[420px]:inline-flex md:hidden items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-accent/60 px-2 py-0.5 rounded-full border border-border/40"
              aria-label={`Current section: ${currentActive}`}
            >
              {currentActive === "work" ? "projects" : currentActive}
            </span>
          )}
        </div>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {links.map((link) => {
            const isActive = isHome && currentActive === link.href.slice(1);
            // No withBasePath here: next/link already prefixes `basePath`, so
            // adding it by hand produced `/Portfolio/Portfolio/#about` on every
            // non-home page (all 8 nav links 404'd on the 17 project pages).
            const targetHref = isHome ? link.href : `/${link.href}`;

            return (
              <Link
                key={link.href}
                href={targetHref}
                onClick={(e) => {
                  if (isHome) {
                    e.preventDefault();
                    scrollToId(link.href.slice(1));
                  }
                }}
                className={cn(
                  "relative px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.03em] transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-px origin-left bg-signal transition-transform duration-300",
                    isActive ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <CommandMenu />
          <ThemeToggle />
          <MobileNav activeSection={currentActive} />
        </div>
      </div>
    </header>
  );
}

/**
 * Scroll progress line, rendered above the header so it is always visible.
 * Lives in its own component so the header can hide without taking it away.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        bar,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: true },
        },
      );
    }, bar);
    return () => ctx.revert();
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left scale-x-0 bg-signal/70"
      />
    </div>
  );
}
