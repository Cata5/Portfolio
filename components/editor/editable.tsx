"use client";

import { useState, type ReactNode } from "react";
import { Edit3 } from "lucide-react";

import { useEditor, type FieldType } from "./editor-context";
import { cn } from "@/lib/utils";

interface EditableProps {
  path: string;
  label: string;
  type?: FieldType;
  value?: unknown;
  meta?: unknown;
  className?: string;
  children: ReactNode;
  inline?: boolean;
}

export function Editable({
  path,
  label,
  type = "text",
  value,
  meta,
  className,
  children,
  inline = false,
}: EditableProps) {
  const { isEditing, selectedField, setSelectedField } = useEditor();
  const [isHovered, setIsHovered] = useState(false);

  if (!isEditing) {
    return <>{children}</>;
  }

  const isSelected = selectedField?.path === path;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedField({
      path,
      label,
      type,
      value,
      meta,
    });
  };

  const Component = inline ? "span" : "div";

  return (
    <Component
      data-editable-field="true"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group/editable relative transition-all duration-150 cursor-pointer",
        inline ? "inline-block" : "block",
        isSelected
          ? "outline outline-2 outline-signal outline-offset-4 rounded-md bg-signal/[0.06] shadow-[0_0_20px_rgba(128,82,255,0.25)]"
          : "hover:outline hover:outline-1 hover:outline-dashed hover:outline-signal/70 hover:outline-offset-4 rounded-sm hover:bg-signal/[0.02]",
        className,
      )}
    >
      {children}

      {/* Floating Field Label Badge - positioned cleanly above without interrupting the outline */}
      {(isHovered || isSelected) && (
        <span
          className={cn(
            "pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-[60] inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] shadow-lg backdrop-blur-md transition-opacity duration-150 whitespace-nowrap",
            isSelected
              ? "bg-signal text-white ring-1 ring-white/20 shadow-signal/30"
              : "bg-neutral-950/95 text-signal border border-signal/40",
          )}
        >
          <Edit3 className="size-2.5" />
          {label}
        </span>
      )}
    </Component>
  );
}
