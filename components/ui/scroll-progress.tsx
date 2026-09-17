/**
 * Scroll progress — after Magic UI's Scroll Progress, re-tokenized.
 *
 * The registry version drives `scaleX` from `motion`'s `useScroll`, in a
 * violet→pink→peach gradient. Here it is one accent-coloured bar driven by
 * a CSS scroll-driven animation (`animation-timeline: scroll()`), defined in
 * design/tokens.css:
 *
 *   · zero JavaScript, so nothing to hydrate and nothing that can disagree
 *     with Lenis or ScrollTrigger about where the page is
 *   · browsers without scroll timelines simply do not show it — it is an
 *     enhancement, and its absence costs the reader nothing
 *   · one colour, per rule 1
 */

export function ScrollProgress() {
  return <div aria-hidden="true" data-showcase-dim className="scroll-progress" />;
}
