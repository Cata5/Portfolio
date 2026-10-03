import Image from "next/image";

import { ScrollScale } from "@/components/motion/scroll-scale";
import { cn } from "@/lib/utils";

/**
 * Full-width editorial media band — breaks up long case-study prose with a
 * real screenshot. Unlike the hero visual, bands are quieter: no hover zoom,
 * just a soft scale-in on scroll and an optional mono caption.
 */
export function MediaBand({
  src,
  alt,
  caption,
  className,
  priority,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={cn("mt-16 md:mt-20", className)}>
      <ScrollScale from={0.96}>
        <div className="relative aspect-[16/10] overflow-hidden bg-muted/15 sm:aspect-[16/9]">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(min-width: 1120px) 1120px, 100vw"
            className="object-contain"
          />
        </div>
      </ScrollScale>
      {caption && (
        <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
