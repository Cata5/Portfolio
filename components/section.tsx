import type { HTMLAttributes, ReactNode } from "react";

import { Container } from "@/components/container";
import { Eyebrow } from "@/components/motion/eyebrow";
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
  return (
    <section
      id={id}
      className={cn("scroll-mt-16", className)}
      {...props}
    >
      <Container className={cn("py-24 md:py-36", contentClassName)}>
        <SectionHeader eyebrow={eyebrow} />
        {children}
      </Container>
    </section>
  );
}
