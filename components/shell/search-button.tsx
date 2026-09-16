"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { PALETTE_EVENT } from "@/lib/search";

/**
 * The visible way into search, for anyone who will never press Ctrl+K.
 * `rail`: a full-width row above the nav, with the shortcut shown.
 * `bar`: a round icon button in the mobile top bar.
 *
 * The shortcut label reads ⌘K on Apple devices, Ctrl K elsewhere — decided
 * after mount, so server and client markup match.
 */
export function SearchButton({ variant }: { variant: "rail" | "bar" }) {
  const [mac, setMac] = useState(false);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  const open = () => window.dispatchEvent(new Event(PALETTE_EVENT));

  if (variant === "bar") {
    return (
      <button
        type="button"
        onClick={open}
        aria-label="Search the site"
        // size-10: 32px was under the 40px a thumb needs (R10, mobile bar).
        className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-text-3 transition-colors hover:border-accent hover:text-accent"
      >
        <Search size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}
      // h-9, not h-11: the rail is full at 1280x720, and a taller row pushed
      // Contact out of view (measured, Phase 4).
      className="flex h-9 w-full items-center gap-3 rounded-lg border border-line bg-surface px-4 text-sm text-text-3 shadow-soft transition-colors hover:border-accent hover:text-text"
    >
      <Search size={17} strokeWidth={1.75} aria-hidden="true" />
      <span className="flex-1 text-left">Search the site</span>
      <kbd className="rounded-sm border border-line px-1.5 py-0.5 font-mono text-2xs text-text-3">
        {mac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
