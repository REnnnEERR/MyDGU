"use client";
import { useRef, useEffect } from "react";

export function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={`resize-none overflow-hidden bg-transparent border-b border-du-gray-500 pb-2 text-sm focus:outline-none placeholder:text-du-gray-500 ${className}`}
    />
  );
}
