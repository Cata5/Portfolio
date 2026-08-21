import { scrollToId } from "@/components/motion/lenis";
import { withBasePath } from "@/lib/base-path";

export interface NavigationTarget {
  target: string;
  type: "scroll" | "route" | "external";
  label?: string;
}

/**
 * Smoothly scrolls to a section on the current page or navigates to dynamic sub-routes,
 * applying a high-visibility glowing aura animation.
 */
export function highlightAndScrollTo(
  target: string,
  type: "scroll" | "route" | "external" = "scroll",
  router?: { push: (url: string) => void }
): void {
  if (!target) return;

  if (type === "external") {
    window.open(target, "_blank", "noopener,noreferrer");
    return;
  }

  if (type === "route") {
    if (router && typeof window !== "undefined") {
      router.push(withBasePath(target));
    }
    return;
  }

  const sectionId = target.replace(/^#/, "").trim();
  if (!sectionId) return;

  // Verify target element exists in DOM before attempting scroll
  if (typeof document === "undefined") return;
  const el = document.getElementById(sectionId);
  if (!el) return;

  // Smooth scroll to section via Lenis / native fallback without modifying window.location
  try {
    scrollToId(sectionId);
  } catch {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Apply glowing aura highlight animation to target DOM element
  setTimeout(() => {
    const targetEl = document.getElementById(sectionId);
    if (targetEl) {
      // Remove any existing highlight first
      targetEl.classList.remove("rag-section-highlight");
      // Force reflow
      void targetEl.offsetWidth;
      // Add animation class
      targetEl.classList.add("rag-section-highlight");

      // Cleanup after animation finishes
      setTimeout(() => {
        targetEl.classList.remove("rag-section-highlight");
      }, 3600);
    }
  }, 100);
}

/**
 * Checks if the user's prompt is an explicit navigation command.
 */
export function isExplicitNavigationQuery(query: string): boolean {
  if (!query) return false;
  const q = query.trim().toLowerCase();

  const navPatterns = [
    /\b(take me to|go to|show me|navigate to|scroll to|jump to|open|head to|bring me to)\b/i,
  ];

  return navPatterns.some((p) => p.test(q));
}

/**
 * Resolves a natural query to its primary in-page section anchor.
 * Returns null if no specific section is identified.
 */
export function resolveQueryTarget(query: string): string | null {
  if (!query) return null;
  const q = query.toLowerCase();

  // Contact queries
  if (
    /\b(contact|email|reach|hire|message|social|linkedin|github|instagram|phone|write to)\b/.test(
      q
    )
  ) {
    return "contact";
  }

  // Stack / Skills queries
  if (
    /\b(stack|skills?|technolog(y|ies)|frameworks?|languages?|libraries|competencies)\b/.test(
      q
    )
  ) {
    return "stack";
  }

  // ML queries
  if (
    /\b(ml|machine learning|yolo|mnist|experiments?|notebook|ultralytics|weights)\b/.test(
      q
    )
  ) {
    return "ml";
  }

  // Flagship / Projects
  if (
    /\b(vortex|flagship|featured project|main project|best project)\b/.test(
      q
    )
  ) {
    return "work";
  }

  if (
    /\b(all projects|projects directory|project list|explorer|other projects|apps)\b/.test(
      q
    )
  ) {
    return "projects";
  }

  // About / Bio
  if (
    /\b(about|who is|bio|education|university|faculty|etti|study|background|cv|resume)\b/.test(
      q
    )
  ) {
    return "about";
  }

  if (/\b(journey|timeline|career|milestones?|history)\b/.test(q)) {
    return "journey";
  }

  if (/\b(certifications?|certificates?|ccna|ic3|cisco|credentials?)\b/.test(q)) {
    return "certifications";
  }

  if (/\b(activities|competitions?|hackathon|unihack|ftc|robotics|mentor)\b/.test(q)) {
    return "activities";
  }

  return null;
}

/**
 * Resolves a citation / document path to its page anchor on the portfolio.
 */
export function resolveDocumentTarget(filePath: string): string {
  const p = filePath.toLowerCase();
  if (p.includes("skills")) return "stack";
  if (p.includes("ml")) return "ml";
  if (p.includes("projects")) return "work";
  if (p.includes("certifications")) return "certifications";
  if (p.includes("journey")) return "journey";
  if (p.includes("activities")) return "activities";
  if (p.includes("site") || p.includes("about") || p.includes("bio")) return "about";
  return "work";
}
