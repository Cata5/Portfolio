"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";

import { useRouter } from "next/navigation";

import { beginProjectTransition } from "@/lib/page-transition";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A project link that triggers the shared expand transition: the visual grows
 * to fill the viewport while the router navigates beneath it. The target page
 * fades the overlay via <PageReveal>.
 *
 * - Modifier-click (new tab / middle click) always navigates natively.
 * - Reduced motion and touch devices navigate instantly, no overlay.
 */
export function ProjectLink({
  href,
  src,
  children,
  className,
}: {
  href: string;
  /** Image the expanding overlay should carry. */
  src?: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    if (prefersReducedMotion() || !hasFinePointer()) return;
    e.preventDefault();

    const visual = ref.current?.querySelector("[data-project-visual]");
    const rect =
      (visual as HTMLElement | null)?.getBoundingClientRect() ??
      ref.current?.getBoundingClientRect();
    if (rect && src) beginProjectTransition(rect, src);

    router.push(href);
  };

  return (
    <a
      ref={ref}
      href={href}
      onClick={onClick}
      data-cursor="view"
      className={cn("group", className)}
    >
      {children}
    </a>
  );
}
