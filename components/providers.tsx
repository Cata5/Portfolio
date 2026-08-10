"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "next-themes";

import { Cursor } from "@/components/motion/cursor";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delay={250}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <SmoothScroll>
          <Cursor />
          {children}
        </SmoothScroll>
      </ThemeProvider>
    </TooltipProvider>
  );
}
