"use client";

import { Menu } from "lucide-react";

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

const links = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#work" },
  { label: "Stack", href: "#stack" },
  { label: "ML", href: "#ml" },
  { label: "Apps", href: "#apps" },
  { label: "Contact", href: "#contact" },
] as const;

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2.5 font-sans text-sm font-semibold">
            <span className="size-2 bg-signal" aria-hidden="true" />
            {site.name}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-2" aria-label="Mobile navigation">
          {links.map((link) => (
            <SheetClose
              key={link.href}
              nativeButton={false}
              render={
                <a
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-3 text-[15px] text-muted-foreground transition-colors hover:text-foreground"
                />
              }
            >
              <span className="size-1 bg-border" aria-hidden="true" />
              {link.label}
            </SheetClose>
          ))}
        </nav>
        <div className="mt-auto border-t border-border p-4 font-mono text-[11px] text-muted-foreground">
          {site.role}
        </div>
      </SheetContent>
    </Sheet>
  );
}
