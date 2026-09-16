"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { A11Y_EVENT, prefersReduced } from "@/lib/a11y";
import { NAV } from "./nav-links";

/**
 * Mobile tab bar — after the reference: below lg, navigation lives in a
 * floating bar at the bottom of the screen, where a thumb already is,
 * instead of behind a menu button.
 *
 * Every route is one tap from every page. It floats clear of the home
 * indicator (safe-area inset), and the panel content carries bottom padding
 * so it never covers the footer. Hidden from lg up, where the rail does the
 * same job.
 *
 * It slides away while the reader scrolls down and comes back the moment
 * they scroll up or reach the top: R10 (2026-09-16) measured it sitting on
 * top of content at rest — 15% of the first work card, 52% of a tools row on
 * /about — and /services is 6,000px of reading on a phone. Under reduced
 * motion it never moves; a control that disappears is worse than one that
 * overlaps for anyone who cannot track the movement.
 */

/** Ignore the scroll jitter a finger makes while reading. */
const STEP = 6;
/** Stay put near the top, where the bar covers nothing anyway. */
const KEEP = 120;
/** And near the bottom, for the same reason: the panel reserves a band under
 *  the footer for this bar (app/layout.tsx), so down there it covers nothing
 *  either — and hiding it left that band visibly empty, which is what a
 *  reader who scrolls to the end sees. */
const END = 64;
const isMainField = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  !!el.closest("#main") &&
  /^(input|textarea|select)$/i.test(el.tagName);

export function TabBar() {
  const pathname = usePathname();
  const [away, setAway] = useState(false);

  // A form field under the bar is worse than a card under it: on /contact the
  // bar sat on top of the company field, and on a phone the keyboard pushes
  // more of the form under it. While a field has focus, the bar steps aside —
  // this one applies under reduced motion too, since it removes an obstacle
  // rather than decorating anything.
  useEffect(() => {
    const onIn = (e: FocusEvent) => {
      if (isMainField(e.target)) setAway(true);
    };
    const onOut = (e: FocusEvent) => {
      if (isMainField(e.target) && !isMainField(e.relatedTarget)) setAway(false);
    };
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  useEffect(() => {
    setAway(false);
    if (prefersReduced()) return;

    let last = window.scrollY;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const dy = y - last;
      const atEnd =
        y + window.innerHeight >=
        document.documentElement.scrollHeight - END;
      const fieldFocused = isMainField(document.activeElement);
      if (Math.abs(dy) < STEP) {
        if (atEnd && !fieldFocused) setAway(false);
        return;
      }
      last = y;
      if (atEnd) {
        if (!fieldFocused) setAway(false);
        return;
      }
      setAway(dy > 0 && y > KEEP);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const onA11y = () => {
      if (prefersReduced()) setAway(false);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(A11Y_EVENT, onA11y);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(A11Y_EVENT, onA11y);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <nav
      aria-label="Main"
      data-intro="tabbar"
      className={cn("tabbar fixed inset-x-3 bottom-3 z-40 lg:hidden", away && "tabbar--away")}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch gap-1 rounded-full border border-line bg-surface/90 p-1.5 shadow-soft backdrop-blur-md">
        {NAV.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          const Icon = l.icon;

          return (
            <li key={l.href} className="flex-1">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-full py-1.5 text-2xs font-semibold transition-colors",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-text-3 hover:text-text",
                )}
              >
                <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
