"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Light ⇄ dark. Light is the default; `.dark` on <html> switches the token
 * block in design/tokens.css.
 *
 * The initial class is set by the inline script in app/layout.tsx before
 * first paint, so this component only has to report and flip it. Reading the
 * DOM in an effect (rather than during render) keeps the server and client
 * markup identical — the label is empty on the server pass and filled after
 * mount, which is why the button carries a static aria-label.
 */

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode, blocked storage — the toggle still works for this view */
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark theme"
      aria-pressed={dark ?? false}
      className={cn(
        // size-10: 32px was under the 40px a thumb needs (R10, mobile bar).
        "grid size-10 shrink-0 place-items-center rounded-full border border-line text-text-3 transition-colors hover:border-accent hover:text-accent",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  );
}
