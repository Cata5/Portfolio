"use client";

import { useState, useEffect } from "react";

interface TagInputProps {
  value: string[] | undefined | null;
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Robust comma-separated array input that allows natural typing of spaces and commas
 * without erasing in-progress input or moving the cursor prematurely.
 */
export function TagInput({
  value,
  onChange,
  placeholder = "e.g. React, TypeScript, Next.js",
  className,
}: TagInputProps) {
  const [text, setText] = useState<string>(() => (value || []).join(", "));

  // Keep in sync when external value fundamentally changes (e.g. user selected different project)
  useEffect(() => {
    const currentJoined = (value || []).join(", ");
    const currentParsed = text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const targetArr = value || [];

    const arraysMatch =
      currentParsed.length === targetArr.length &&
      currentParsed.every((item, i) => item === targetArr[i]);

    if (!arraysMatch) {
      setText(currentJoined);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    const parsed = newText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onChange(parsed);
  };

  const handleBlur = () => {
    const parsed = text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setText(parsed.join(", "));
    onChange(parsed);
  };

  return (
    <input
      type="text"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}
