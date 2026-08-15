"use client";

import { useEffect, useState } from "react";

import { useTheme } from "next-themes";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { scrollToId } from "@/components/motion/lenis";
import { site } from "@/data/site";

const sections = [

  { label: "About", target: "about", hint: "background" },
  { label: "My best project", target: "work", hint: "flagship" },
  { label: "Stack", target: "stack", hint: "tools" },
  { label: "ML", target: "ml", hint: "notebook" },
  { label: "Contact", target: "contact", hint: "write to me" },
] as const;

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform);
  const shortcut = isMac ? "⌘K" : "Ctrl K";

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = (fn: () => void) => {
    setOpen(false);
    window.setTimeout(fn, 60);
  };

  const goTo = (id: string) => close(() => scrollToId(id));

  const openExternal = (href: string) =>
    close(() => window.open(href, "_blank", "noopener,noreferrer"));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-1.5 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        aria-label={`Open command palette (${shortcut})`}
      >
        <kbd>{shortcut}</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-xl">
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigate">
              {sections.map((s) => (
                <CommandItem
                  key={s.target}
                  value={`go-to-${s.target}`}
                  onSelect={() => goTo(s.target)}
                >
                  <span>{s.label}</span>
                  <CommandShortcut>{s.hint}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem
                value="open-github"
                onSelect={() => openExternal(site.github)}
              >
                <span>Open GitHub</span>
              </CommandItem>
              <CommandItem
                value="toggle-theme"
                onSelect={() => {
                  setOpen(false);
                  setTheme(resolvedTheme === "dark" ? "light" : "dark");
                }}
              >
                <span>Toggle theme</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
