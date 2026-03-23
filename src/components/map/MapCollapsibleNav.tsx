"use client";

import { useCallback, useState } from "react";

type MapCollapsibleNavProps = {
  children: React.ReactNode;
};

/**
 * Top bar on /map: collapsed by default; expands while the pointer is over the nav region
 * and collapses on mouse leave so the map stays unobstructed.
 */
export function MapCollapsibleNav({ children }: MapCollapsibleNavProps) {
  const [open, setOpen] = useState(false);

  const handleEnter = useCallback(() => setOpen(true), []);
  const handleLeave = useCallback(() => setOpen(false), []);

  return (
    <header
      className="relative z-30 shrink-0"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="flex cursor-default items-center justify-between gap-3 border-b border-zinc-200/90 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
            ReelMap US
          </span>
          <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            United States fishing map
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
          <span className="hidden text-[10px] sm:inline">
            {open ? "Move away to hide" : "Hover for panels"}
          </span>
          <svg
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      <div
        className={`overflow-hidden border-zinc-200/90 bg-white/85 shadow-md backdrop-blur-md transition-[max-height,opacity,border-width] duration-300 ease-out dark:border-zinc-800/80 dark:bg-zinc-950/90 ${
          open
            ? "max-h-[min(85vh,960px)] border-b border-t border-zinc-200/60 opacity-100 dark:border-zinc-800/60"
            : "max-h-0 border-0 opacity-0"
        }`}
      >
        <div
          className={
            open
              ? "mx-auto max-h-[min(80vh,900px)] max-w-6xl overflow-y-auto px-4 py-5"
              : "pointer-events-none px-4 py-5"
          }
          aria-hidden={!open}
        >
          {children}
        </div>
      </div>
    </header>
  );
}
