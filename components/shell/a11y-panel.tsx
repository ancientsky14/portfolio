"use client";

import { useEffect, useRef, useState } from "react";
import {
  ALargeSmall,
  Accessibility,
  Contrast,
  Pause,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  A11Y_DEFAULT,
  readA11y,
  writeA11y,
  type A11yPrefs,
} from "@/lib/a11y";

/**
 * Accessibility panel — text size, high contrast, reduced motion.
 *
 * After the reference shell's floating accessibility button: bottom-left on
 * desktop, beside the copyright at the foot of the rail (whose text is
 * inset to clear it). Bottom-right on mobile, where there is no rail and
 * the bottom-left corner is where thumbs rest on the content.
 *
 * Preferences persist in localStorage and are applied as classes on <html>
 * (see lib/a11y.ts and the boot script in app/layout.tsx). The CSS they
 * switch lives at the bottom of design/tokens.css.
 *
 * Keyboard: the button toggles the panel, focus moves into it on open and
 * back to the button on close, Escape closes it, and so does a click
 * outside. The toggles are real switches with `aria-checked`.
 */

const SIZES: { label: string; value: A11yPrefs["text"] }[] = [
  { label: "A", value: 0 },
  { label: "A+", value: 1 },
  { label: "A++", value: 2 },
];

function Switch({
  checked,
  onChange,
  icon: Icon,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: typeof Contrast;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-md border border-line bg-surface p-3 text-left transition-colors hover:border-accent"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
        <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-text">{label}</span>
        <span className="block text-xs text-text-3">{hint}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-line-2",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-surface transition-transform duration-300 ease-(--ease-out)",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function A11yPanel() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(A11Y_DEFAULT);

  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Read after mount, so the server and first client render agree. The
  // classes themselves are already on <html> from the boot script.
  useEffect(() => {
    setPrefs(readA11y());
  }, []);

  useEffect(() => {
    if (!open) return;

    panel.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    function onPointer(e: PointerEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function update(next: A11yPrefs) {
    setPrefs(next);
    writeA11y(next);
  }

  return (
    <div
      ref={wrap}
      data-showcase-dim
      className="fixed bottom-24 right-4 z-50 lg:bottom-5 lg:left-6 lg:right-auto"
    >
      {open ? (
        <div
          ref={panel}
          id="a11y-panel"
          role="dialog"
          aria-label="Accessibility settings"
          tabIndex={-1}
          className="absolute bottom-16 right-0 w-76 max-w-[calc(100vw-2.5rem)] rounded-lg border border-line bg-surface p-4 shadow-soft outline-none lg:left-0 lg:right-auto"
        >
          <div className="flex items-center justify-between">
            <p className="font-display text-base font-bold tracking-tight">
              Accessibility
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                button.current?.focus();
              }}
              aria-label="Close accessibility settings"
              className="grid size-8 place-items-center rounded-full text-text-3 transition-colors hover:bg-surface-2 hover:text-text"
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-3">
              <ALargeSmall size={14} strokeWidth={1.75} aria-hidden="true" />
              Text size
            </p>
            <div
              role="group"
              aria-label="Text size"
              className="mt-2 grid grid-cols-3 gap-1.5"
            >
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={prefs.text === s.value}
                  onClick={() => update({ ...prefs, text: s.value })}
                  className={cn(
                    "rounded-md border py-2 text-sm font-bold transition-colors",
                    prefs.text === s.value
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line bg-surface text-text hover:border-accent",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Switch
              checked={prefs.contrast}
              onChange={(v) => update({ ...prefs, contrast: v })}
              icon={Contrast}
              label="High contrast"
              hint="Darker text, stronger edges"
            />
            <Switch
              checked={prefs.reduceMotion}
              onChange={(v) => update({ ...prefs, reduceMotion: v })}
              icon={Pause}
              label="Reduce motion"
              hint="No animation, no moving hero"
            />
          </div>

          <button
            type="button"
            onClick={() => update(A11Y_DEFAULT)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-line py-2 text-sm font-semibold text-text-2 transition-colors hover:border-accent hover:text-text"
          >
            <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
            Reset to default
          </button>
        </div>
      ) : null}

      <button
        ref={button}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label="Accessibility settings"
        className="grid size-12 place-items-center rounded-full bg-text text-ground shadow-soft transition-transform duration-300 ease-(--ease-out) hover:scale-105"
      >
        <Accessibility size={22} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}
