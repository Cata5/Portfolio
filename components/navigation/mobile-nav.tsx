"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, Sparkles } from "lucide-react";

import { scrollToId } from "@/components/motion/lenis";
import { useRAG } from "@/components/rag/rag-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { site } from "@/data/site";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/utils";

import { useEditor } from "@/components/editor/editor-context";
import { buildNavLinks } from "@/lib/nav-links";

const SECTION_DESCRIPTIONS: Record<string, string> = {
  about: "Background & focus",
  work: "Vortex multi-platform system",
  "featured-projects": "Vortex multi-platform system",
  projects: "Archive & code repository",
  stack: "Technologies & tools",
  certifications: "Verified credentials",
  ml: "Experiments & models",
  journey: "Timeline & milestones",
  activities: "Extracurriculars & initiatives",
  contact: "Get in touch",
};

interface MobileNavProps {
  activeSection?: string | null;
}

export function MobileNav({ activeSection }: MobileNavProps) {
  const { content } = useEditor();
  const pathname = usePathname();
  const isHome =
    pathname === "/" ||
    pathname === "" ||
    pathname.endsWith("/Portfolio/");
  const { setIsOpen: setIsRAGOpen } = useRAG();

  // buildNavLinks falls back to hardcoded defaults — the mobile drawer must
  // never go empty (a CMS save once stripped navLabel and broke the live nav).
  const links = buildNavLinks(content?.sections).map((l) => ({
    ...l,
    desc:
      SECTION_DESCRIPTIONS[l.target] ||
      SECTION_DESCRIPTIONS[l.href.slice(1)] ||
      "Section",
  }));

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60 cursor-pointer"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[300px] border-l border-border/50 bg-background/90 backdrop-blur-2xl dark:border-white/10 dark:bg-black/90 p-0 flex flex-col justify-between"
      >
        <div className="flex flex-col">
          <SheetHeader className="border-b border-border/50 dark:border-white/10 p-5">
            <SheetTitle className="flex items-center gap-2.5 font-sans text-sm font-semibold">
              <span
                className="size-2 rounded-full bg-signal shadow-[0_0_8px_var(--color-signal)]"
                aria-hidden="true"
              />
              {site.name}
            </SheetTitle>
          </SheetHeader>

          <nav
            className="flex flex-col gap-1 p-3"
            aria-label="Mobile navigation"
          >
            {links.map((link) => {
              const sectionId = link.href.slice(1);
              const isActive = isHome && activeSection === sectionId;
              const targetHref = isHome
                ? link.href
                : withBasePath(`/${link.href}`);

              return (
                <SheetClose
                  key={link.href}
                  nativeButton={false}
                  render={
                    <Link
                      href={targetHref}
                      onClick={(e) => {
                        if (isHome) {
                          e.preventDefault();
                          scrollToId(sectionId);
                        }
                      }}
                      className={cn(
                        "group flex items-center justify-between rounded-xl px-3.5 py-3 transition-all duration-200",
                        isActive
                          ? "bg-signal/15 text-foreground font-semibold border border-signal/25"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground border border-transparent",
                      )}
                    />
                  }
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "size-1.5 rounded-full transition-all",
                          isActive
                            ? "bg-signal scale-125"
                            : "bg-muted-foreground/40 group-hover:bg-foreground/60",
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-[14px] font-medium tracking-tight text-foreground">
                        {link.label}
                      </span>
                    </div>
                    <span className="pl-4 text-[11px] text-muted-foreground font-mono">
                      {link.desc}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "font-mono text-[11px] transition-transform duration-200 group-hover:translate-x-0.5",
                      isActive ? "text-signal" : "text-muted-foreground/50",
                    )}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </SheetClose>
              );
            })}
          </nav>
        </div>

        {/* Footer actions inside the drawer */}
        <div className="border-t border-border/50 dark:border-white/10 p-4 space-y-3 bg-card/20 backdrop-blur-sm">
          <SheetClose
            render={
              <button
                type="button"
                onClick={() => setIsRAGOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-signal/30 bg-signal/10 hover:bg-signal/20 px-3 py-2.5 text-[12px] font-medium text-foreground transition-colors cursor-pointer"
              />
            }
          >
            <Sparkles className="size-3.5 text-signal" />
            <span>Ask AI Assistant</span>
          </SheetClose>

          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] text-muted-foreground">
              {site.role}
            </span>
            <Link
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
