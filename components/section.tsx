"use client";

import type { HTMLAttributes, ReactNode } from "react";

import { Container } from "@/components/container";
import { Eyebrow } from "@/components/motion/eyebrow";
import { useEditor } from "@/components/editor/editor-context";
import { scrollToId } from "@/components/motion/lenis";
import { cn } from "@/lib/utils";

/** Saffron uppercase label with a drawing rule — the Dala eyebrow. Not a heading; section titles are real h2s. */
export function SectionHeader({
  eyebrow,
  className,
}: {
  eyebrow: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-10 md:mb-14", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
    </div>
  );
}

export function Section({
  id,
  eyebrow,
  children,
  className,
  contentClassName,
  ...props
}: {
  id?: string;
  eyebrow: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
} & HTMLAttributes<HTMLElement>) {
  const { isEditing, selectedField, setSelectedField } = useEditor();

  const isSectionSelected =
    isEditing &&
    selectedField?.type === "section" &&
    (selectedField?.meta as { sectionId?: string })?.sectionId === id;

  const handleSectionClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!isEditing || !id) return;
    const target = e.target as HTMLElement;
    // Don't intercept if clicking an interactive control or a specific editable field element
    if (target.closest("button, a, input, textarea, select, [data-editable-field='true']")) {
      return;
    }
    setSelectedField({
      path: `section.${id}`,
      label: `Section: ${eyebrow || id}`,
      type: "section",
      meta: { sectionId: id, eyebrow },
    });
    scrollToId(id);
  };

  return (
    <section
      id={id}
      onClick={handleSectionClick}
      className={cn(
        "relative scroll-mt-16 transition-all duration-200",
        isEditing && id && "cursor-pointer group/section",
        isEditing && id && !isSectionSelected && "hover:ring-1 hover:ring-signal/40 hover:ring-offset-4 hover:ring-offset-background rounded-3xl",
        isSectionSelected && "ring-2 ring-signal ring-offset-6 ring-offset-background rounded-3xl bg-signal/[0.015] shadow-[0_0_50px_rgba(128,82,255,0.12)]",
        className,
      )}
      {...props}
    >
      {/* Floating Section Status Badge when Selected in Edit Mode */}
      {isEditing && isSectionSelected && (
        <div className="pointer-events-none absolute right-4 top-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-signal px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-signal-ink shadow-xl shadow-signal/30 animate-in fade-in zoom-in-95 duration-150">
          <span>Section: {eyebrow || id} (Editing All Text)</span>
        </div>
      )}

      <Container className={cn("py-24 md:py-36", contentClassName)}>
        <SectionHeader eyebrow={eyebrow} />
        {children}
      </Container>
    </section>
  );
}
