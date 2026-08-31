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
import { useEditor } from "@/components/editor/editor-context";
import { useRAG } from "@/components/rag/rag-context";
import { scrollToId } from "@/components/motion/lenis";
import { site } from "@/data/site";

const sections = [
  { label: "About", target: "about", hint: "background" },
  { label: "My best project", target: "work", hint: "flagship" },
  { label: "Stack", target: "stack", hint: "tools" },
  { label: "ML", target: "ml", hint: "notebook" },
  { label: "Journey", target: "journey", hint: "milestones" },
  { label: "Contact", target: "contact", hint: "write to me" },
] as const;

import { usePathname, useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const { toggleEdit, isEditing } = useEditor();
  const { setIsOpen: setIsRAGOpen } = useRAG();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/" || pathname === "" || pathname.endsWith("/Portofolio-V2/");

  const [shortcut, setShortcut] = useState("Ctrl K");
  const [editShortcut, setEditShortcut] = useState("Ctrl E");
  const [ragShortcut, setRagShortcut] = useState("Ctrl J");

  useEffect(() => {
    if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)) {
      setShortcut("⌘K");
      setEditShortcut("⌘E");
      setRagShortcut("⌘J");
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key?.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
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

  const goTo = (id: string) =>
    close(() => {
      if (isHome) {
        scrollToId(id);
      } else {
        router.push(`/#${id}`);
      }
    });

  const openExternal = (href: string) =>
    close(() => window.open(href, "_blank", "noopener,noreferrer"));

  return (
    <>
      {/* Mobile search trigger */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        className="sm:hidden size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60"
        aria-label="Open search and commands"
      >
        <Search className="size-3.5" />
      </Button>

      {/* Desktop keyboard shortcut */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-1.5 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex cursor-pointer"
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
                value="ask-rag-ai"
                onSelect={() => {
                  setOpen(false);
                  setIsRAGOpen(true);
                }}
              >
                <span>Ask Portfolio AI Assistant</span>
                <CommandShortcut>{ragShortcut}</CommandShortcut>
              </CommandItem>
              <CommandItem
                value="admin-control-center"
                onSelect={() => {
                  setOpen(false);
                  router.push(withBasePath("/admin"));
                }}
              >
                <span>Portfolio Control Center (Admin)</span>
              </CommandItem>
              <CommandItem
                value="toggle-editor"
                onSelect={() => {
                  setOpen(false);
                  toggleEdit();
                }}
              >
                <span>{isEditing ? "Exit Editor" : "Visual Editor (CMS)"}</span>
                <CommandShortcut>{editShortcut}</CommandShortcut>
              </CommandItem>
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
