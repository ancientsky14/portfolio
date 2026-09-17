"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { RotateCcw, X } from "lucide-react";
import { A11Y_EVENT } from "@/lib/a11y";
import { BG_EVENT, SHOWCASE, type ShowcaseDetail } from "@/lib/motion";

/**
 * "Watch it assemble" — steps the interface aside and plays the Archipelago's
 * whole resolve, then brings the interface back.
 *
 * Why it does more than send an event (R17). The old button sent scatter →
 * gather and nobody could see it: off the home page the field renders at
 * 0.30 opacity, it sits behind opaque cards and the rail, and scatter only
 * loosens it to 0.55 — so the reader got the last 45% of a resolve, faint,
 * behind a wall. Now every element marked `data-showcase-dim` recedes to 8%
 * (design/tokens.css) and becomes inert, and BG_EVENT.showcase tells the
 * canvas to come up to near-full strength and resolve from nothing.
 *
 * The exit cannot live inside the shell — once the shell is inert this very
 * button is unreachable — so a small control is portalled to <body>, takes
 * focus, and hands it back to this button afterwards: the contract the work
 * viewer and the command palette already keep. The show ends on its own, or
 * early on Escape, on a tap anywhere, or on a route change.
 *
 * It imports nothing from the canvas, so `three` stays out of this bundle.
 * Shown only while the canvas is mounted (`.bg-live-only`): under reduced
 * motion, without WebGL or on Save-Data there is no canvas and no button — a
 * control that does nothing is worse than none.
 */

const DIM = "[data-showcase-dim]";

// Module-level, not a ref: the return outlives the component when a route
// change unmounts it mid-show, and a new show must be able to cancel a
// return still in flight, or its timer strips the class from the next one.
let returnTimer = 0;

function send(on: boolean) {
  window.dispatchEvent(
    new CustomEvent<ShowcaseDetail>(BG_EVENT.showcase, { detail: { on } }),
  );
}

export function BgReplay() {
  const [showing, setShowing] = useState(false);
  // Flips once the field has resolved, so the exit stops saying "Assembling"
  // through a 4.6s hold over a finished chain.
  const [formed, setFormed] = useState(false);
  // Touch visitors can drag the islands during the show (R18), so their hint
  // says so. Decided from the gesture that started the show, not a media
  // query — a touch laptop can start it either way.
  const [touch, setTouch] = useState(false);
  const active = useRef(false);
  const timer = useRef(0);
  const formTimer = useRef(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const exit = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const end = useCallback((returnFocus: boolean) => {
    if (!active.current) return;
    active.current = false;
    window.clearTimeout(timer.current);
    window.clearTimeout(formTimer.current);
    // Swap the two classes in the same frame, so the elements leave the 8%
    // state already carrying the 3s return transition.
    const html = document.documentElement.classList;
    html.add("bg-showcase-return");
    html.remove("bg-showcase");
    window.clearTimeout(returnTimer);
    returnTimer = window.setTimeout(
      () => html.remove("bg-showcase-return"),
      SHOWCASE.out,
    );
    document.querySelectorAll(DIM).forEach((el) => el.removeAttribute("inert"));
    send(false);
    setShowing(false);
    setFormed(false);
    if (returnFocus) trigger.current?.focus({ preventScroll: true });
  }, []);

  function start(e: ReactMouseEvent) {
    if (active.current) return;
    // A click is a PointerEvent in current browsers; a keyboard activation
    // carries no pointer type, so fall back to what the device reports.
    const kind = (e.nativeEvent as PointerEvent).pointerType;
    setTouch(
      kind ? kind !== "mouse" : window.matchMedia("(pointer: coarse)").matches,
    );
    // The canvas can have gone since this button rendered (reduced motion
    // turned on from the panel) — never dim the page over nothing.
    if (document.documentElement.dataset.archipelago !== "live") return;
    active.current = true;
    window.clearTimeout(returnTimer);
    document.documentElement.classList.remove("bg-showcase-return");
    document.documentElement.classList.add("bg-showcase");
    document.querySelectorAll(DIM).forEach((el) => el.setAttribute("inert", ""));
    send(true);
    setShowing(true);
    formTimer.current = window.setTimeout(
      () => setFormed(true),
      SHOWCASE.in + SHOWCASE.assemble,
    );
    timer.current = window.setTimeout(
      () => end(true),
      SHOWCASE.in + SHOWCASE.assemble + SHOWCASE.hold,
    );
  }

  // Move focus to the exit the moment it exists — the button that started
  // the show is now inert, so focus would otherwise fall to <body>.
  useEffect(() => {
    if (showing) exit.current?.focus({ preventScroll: true });
  }, [showing]);

  useEffect(() => {
    if (!showing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") end(true);
    };
    // `click` in the capture phase, not `pointerdown`. Ending on pointerdown
    // would restore the shell's pointer events before the click that follows,
    // and that click would land on whatever link was under the finger. At
    // click time the shell is still inert, so the tap hits nothing.
    //
    // And neither a drag nor a hold is a tap. A finger parts the islands
    // during the show, and with touch-action: none in play a browser is not
    // guaranteed to swallow the click that ends a gesture — so measure it
    // here. Travel alone was not enough: pressing a finger still on the
    // islands and lifting it moved under 10px and ended the show, which is
    // exactly how people play with it. A tap is short AND still.
    let from: { x: number; y: number; at: number } | null = null;
    let travelled = 0;
    const onDown = (e: PointerEvent) => {
      from = { x: e.clientX, y: e.clientY, at: performance.now() };
      travelled = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!from) return;
      travelled = Math.max(
        travelled,
        Math.hypot(e.clientX - from.x, e.clientY - from.y),
      );
    };
    const onClick = () => {
      // No pointerdown first means a keyboard activation — always a tap.
      const gesture =
        from !== null && (travelled > 10 || performance.now() - from.at > 350);
      from = null;
      travelled = 0;
      if (!gesture) end(true);
    };
    // The canvas unmounts when reduced motion is turned on mid-visit
    // (components/hero/archipelago.tsx). Never leave the page dimmed and
    // inert with nothing behind it.
    const onA11y = () => end(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, { capture: true });
    window.addEventListener("pointermove", onMove, { capture: true, passive: true });
    window.addEventListener("click", onClick, { capture: true });
    window.addEventListener(A11Y_EVENT, onA11y);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("pointermove", onMove, { capture: true });
      window.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener(A11Y_EVENT, onA11y);
    };
  }, [showing, end]);

  // A navigation mid-show, and unmounting, both restore the page.
  useEffect(() => () => end(false), [pathname, end]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={start}
        data-magnetic
        className="bg-live-only items-center gap-2 rounded-full bg-text py-2.5 pl-4 pr-5 text-sm font-semibold text-ground transition-opacity hover:opacity-90"
      >
        <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
        Watch it assemble
      </button>

      {showing
        ? createPortal(
            <div className="showcase-exit">
              <button
                ref={exit}
                type="button"
                onClick={() => end(true)}
                // A fixed accessible name: the visible lead word changes
                // mid-show, and a screen reader focused here should not have
                // the whole label re-announced when it does.
                aria-label="Return to the page"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-2 pl-4 pr-3 text-sm font-semibold text-text shadow-soft transition-colors hover:border-accent"
              >
                {touch
                  ? formed
                    ? "Drag to part the islands · tap to return"
                    : "Assembling · tap to return"
                  : formed
                    ? "Esc or tap to return"
                    : "Assembling · Esc or tap to return"}
                <X size={15} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
