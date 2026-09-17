/**
 * The motion signature. One easing, three durations.
 *
 * Kept in sync by hand with --ease-out in design/tokens.css. When a
 * component installed from Magic UI, Aceternity or 21st.dev arrives with
 * its own duration or easing, override it with these rather than letting
 * a fourth timing into the site.
 *
 * Division of labour (build plan §08):
 *   GSAP owns  — scroll-scrubbed timelines, pinning, the hero sequence,
 *                SplitText, DrawSVG, Flip.
 *   motion owns — whatever ships inside a library component: hover and
 *                mount states. Leave those alone.
 *   Never both  — two systems animating the same property on the same
 *                element is the bug you will spend a day finding. If you
 *                need to GSAP a library component, wrap it in a plain div
 *                and animate the wrapper.
 */

/** Durations, in seconds (GSAP's unit). */
export const D = {
  fast: 0.4,
  base: 0.8,
  slow: 1.2,
} as const;

/** GSAP easing. Equivalent to cubic-bezier(.16, 1, .3, 1). */
export const E = "expo.out";
export const E_INOUT = "power2.inOut";

/** Stagger presets, so lists across the site share a rhythm. */
export const STAGGER = {
  tight: 0.04,
  base: 0.07,
  loose: 0.12,
} as const;

/**
 * Window events the motion layer (components/motion/page-motion.tsx) sends
 * to the Archipelago background (components/hero/archipelago-canvas.tsx),
 * so neither imports the other and the background can be absent.
 *
 *   scatter — a page is leaving: the field loosens.
 *   gather  — the new page is in: the field resolves again.
 *   attract — `detail` is the centre, in client px, of the card or button
 *             under the pointer (the islands lean toward it), or null.
 *   showcase — `detail.on`: the /lab "Watch it assemble" button has cleared
 *             the shell, so the field brightens and resolves from nothing;
 *             off returns it to the page's level (components/lab/bg-replay.tsx).
 */
export const BG_EVENT = {
  scatter: "bg:scatter",
  gather: "bg:gather",
  attract: "bg:attract",
  showcase: "bg:showcase",
} as const;

export type AttractDetail = { x: number; y: number } | null;
export type ShowcaseDetail = { on: boolean };

/**
 * The showcase sequence, in ms. Shared by the button that runs it and the
 * canvas that plays it, the same way INTRO is shared below — two files that
 * must agree on one timeline.
 *
 * The show runs ten seconds (in + assemble + hold) and the interface takes
 * three to come back — Jan's timing, 2026-09-17.
 *
 * `assemble` is deliberately NOT the canvas's load-time resolve (`D.slow *
 * 1.4`, 1.68s). It used to be derived from it; they now differ on purpose —
 * a page load must resolve fast, the showcase is meant to be watched. Don't
 * re-link them.
 *
 * These durations only feel as long as they are because the assemble and the
 * return ease in-out (E_INOUT, --ease-in-out). On expo.out, 90% of the
 * movement lands in the first fifth: a 5s assemble read as a 1s snap and a
 * stall, a 3s return as done in under one.
 */
export const SHOWCASE = {
  in: 400,
  assemble: 5000,
  hold: 4600,
  out: 3000,
} as const;

/**
 * Boot intro timing, in ms from navigation start (components/motion/boot-intro.tsx).
 * The inline boot script in app/layout.tsx runs both timers, so the content
 * is revealed at INTRO.done on any device. They used to start at hydration,
 * which on a throttled phone kept the page hidden up to 3s (R9, 2026-09-14).
 */
export const INTRO = {
  out: 1150, // overlay starts fading
  done: 1650, // classes removed, site fully revealed
} as const;