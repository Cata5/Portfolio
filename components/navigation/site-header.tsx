"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { gsap } from "@/components/motion/gsap";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { MobileNav } from "@/components/navigation/mobile-nav";

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

const links = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#work" },
  { label: "Stack", href: "#stack" },
  { label: "ML", href: "#ml" },
  { label: "Apps", href: "#apps" },
  { label: "Contact", href: "#contact" },
] as const;

export function SiteHeader() {
  const [active, setActive] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Section highlighting.
  useEffect(() => {
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
  }, []);

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

  // Hide on scroll down, reveal on scroll up (never below the fold).
  useEffect(() => {
    const header = headerRef.current;
    if (!header || prefersReducedMotion()) return;
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        const hidden = delta > 6 && y > 140;
        gsap.to(header, {
          yPercent: hidden ? -100 : 0,
          duration: 0.35,
          ease: EASE.inOut,
          overwrite: "auto",
        });
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
      <div data-header-inner className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          className="group flex items-center gap-2.5"
          aria-label={`${site.name} — back to top`}
        >
          <span
            className="size-2 bg-signal transition-transform duration-200 group-hover:scale-125"
            aria-hidden="true"
          />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">
            {site.name}
          </span>
        </a>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {links.map((link) => {
            const isActive = active === link.href.slice(1);
            return (
              <a
                key={link.href}
                href={link.href}
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
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <CommandMenu />
          <ThemeToggle />
          <MobileNav />
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
