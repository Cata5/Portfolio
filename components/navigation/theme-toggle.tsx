"use client";

import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  // `resolvedTheme` is undefined during SSR, so the icon is only rendered
  // after mount — otherwise server and client HTML would mismatch.
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- mounted-guard pattern: renders identical HTML on server and first client paint to avoid a next-themes hydration mismatch
  useEffect(() => setMounted(true), []);

  const dark = resolvedTheme === "dark";

  const toggle = () => {
    setTheme(dark ? "light" : "dark");
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle theme"
            onClick={toggle}
          />
        }
      >
        {mounted ? (
          dark ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )
        ) : (
          <span className="size-4" aria-hidden="true" />
        )}
      </TooltipTrigger>
      <TooltipContent>Toggle theme</TooltipContent>
    </Tooltip>
  );
}
