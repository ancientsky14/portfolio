# Archipelago showcase — "Watch it assemble", made worth watching

Approved by Jan 2026-09-16, not yet built. Read [CLAUDE.md](CLAUDE.md) first —
its rules apply here, in particular the motion division of labour and the
reduced-motion end-state requirement.

## Why

`/lab`'s "Watch it assemble" button replays the Archipelago and you can barely
tell. Three measured reasons, none of them the animation's fault:

1. **It plays at 0.30 opacity.** The canvas renders at `uOpacity = base ×
   level` (`components/hero/archipelago-canvas.tsx`). `levelRef` is 1 on the
   home page and **0.6** everywhere else; `base` is 0.5 desktop / 0.35 mobile.
   On `/lab` that is 0.5 × 0.6 = **0.30**.
2. **It plays behind the shell** — a fixed `-z-10` layer under opaque cards,
   surfaces and the rail.
3. **It is not even a full assemble.** `components/lab/bg-replay.tsx` sends
   `scatter` then `gather`, and `onScatter` tweens `uProgress` to **0.55**, not
   0. The viewer sees the last 45% of a resolve.

So the fix is three things at once: clear the way, brighten it, and actually
restart the resolve from zero.

**Jan's decisions (2026-09-16):** the shell **dims and recedes rather than
disappearing** — a blank screen for two seconds reads as a bug, not a
showpiece — and the button appears on the `/lab/archipelago` note page as well
as the `/lab` featured card.

## The change

### 1. `lib/motion.ts` — one event and the timings

Add `showcase: "bg:showcase"` to `BG_EVENT`, detail `{ on: boolean }`,
documented beside `scatter` / `gather` / `attract`.

Add a `SHOWCASE` timing block next to `INTRO`, which exists for exactly this
reason — two files needing to agree on a sequence. In ms: `in: 400`,
`assemble: 1680`, `hold: 500`, `out: 800`. Derive `assemble` from
`D.slow * 1.4` rather than retyping 1680 — that is the figure the canvas's own
intro tween already uses, and the two must not drift apart.

### 2. `components/hero/archipelago-canvas.tsx` — answer it

An `onShowcase` handler beside `onScatter` / `onGather`:

- **on** — tween `opacityRef.current.value` to `0.95` over `SHOWCASE.in`, then
  `gsap.set(uniforms.uProgress, { value: 0 })` and tween it to 1 over
  `SHOWCASE.assemble` with `E`. Clear `pullTarget`, so a card still under the
  pointer is not bending the field through the whole show.
- **off** — ease the opacity back to `baseRef.current * levelRef.current` over
  `SHOWCASE.out`.

`overwrite: true` on both. The route-change effect at the bottom of the file
tweens the same uniform, and two tweens on one property is the bug this
repo's motion notes tell you that you will spend a day finding.

**The island placement does not change.** `lib/archipelago.ts` carries a header
comment about what the chain is and is not; re-centring it for the show would
be a change to that, and it is not needed once the opacity is right.

### 3. `app/layout.tsx` — a hook to fade

Add `data-shell` to the shell wrapper (the `div.flex.min-h-dvh…`). The tab bar,
the accessibility button and the scroll progress bar are **siblings** of it,
not children, so they need naming separately in the CSS.

### 4. `design/tokens.css` — `html.bg-showcase`

Drop `[data-shell]`, `.tabbar`, `.scroll-progress` and the fixed accessibility
button to `opacity: .08` with `pointer-events: none`, transitioned with
`--ease-out` over the `SHOWCASE.in` / `.out` durations.

**Be careful with any scale.** A `transform` on `[data-shell]` makes it the
containing block for every `position: fixed` descendant — the same mechanism
CLAUDE.md already documents for ScrollSmoother, and the reason the WebGL layer
is mounted outside the panel in the first place. The work viewer and the
command palette both render fixed children inside the shell. **Prefer opacity
alone**; only add the transform if the recede looks flat in review, and then
gate it behind "no overlay open" and say so in the comment.

### 5. `components/lab/bg-replay.tsx` — orchestrate, and offer an exit

- Do nothing unless `document.documentElement.dataset.archipelago === "live"`.
- Add `bg-showcase` to `<html>`, dispatch `showcase {on:true}`, run the
  sequence off `SHOWCASE`, then dispatch `{on:false}` and drop the class.
- **The exit cannot live inside the shell.** Once the shell is dimmed and
  `inert`, the button that started the show is unreachable. Portal a small
  fixed hint to `document.body` — "Assembling… press Esc or tap to return",
  `aria-live="polite"`, with a real focusable button. Move focus to it on
  open, `inert` the shell, and on exit remove `inert` and **return focus to
  the button that started it** — the same contract the work viewer and the
  command palette already follow.
- End early on Escape, on pointerdown anywhere, and on route change.
- **Clean up on `A11Y_EVENT`.** `components/hero/archipelago.tsx` unmounts the
  canvas the moment a visitor turns on reduced motion mid-visit. If that
  happens during a show, the shell would be left dimmed and inert with nothing
  to watch. Listen, and tear down. Same on unmount.

### 6. `app/lab/[slug]/page.tsx` — the second entry point

Render `<BgReplay />` in the header after the blurb when
`e.slug === "archipelago"`. The component hides itself when the canvas is not
live (`.bg-live-only`), so no extra guard is needed.

Note plainly: that page still renders **106 words** in production until
`bodyReviewed: true` is set on `content/lab/01-archipelago.mdx`. The button
will work; the note around it is a stub.

## Verification

1. `npm run typecheck && npm run build`.
2. Headless at 390 and 1280 — click the button, then assert:
   - `html.bg-showcase` present and `[data-shell]` computes to opacity .08;
   - the class clears on its own within `in + assemble + hold + out` plus a
     margin, and `[data-shell]` returns to opacity 1;
   - Escape ends it early, `inert` is gone, `document.activeElement` is the
     button again;
   - a route change mid-show clears the class.
3. **No layout shift.** Record CLS across a full run — the budget is 0.05 and
   R9 measured 0.003. Opacity moves nothing; if a transform is used, this is
   the check that catches it.
4. With the canvas absent (emulate reduced motion, where `archipelago.tsx`
   never mounts) the button must not render at all. Confirm that still holds
   at the new `/lab/archipelago` placement.
5. Keyboard only: tab to the button, Enter, focus lands on the hint, Escape,
   focus back on the button, shell tabbable again.
6. axe at 390 and 1280, both themes, 0 violations — **including during the
   show**, which is the state most likely to fail contrast.
7. By eye on a phone viewport: the chain is legible at 0.95 against the ground
   colour in both themes.

## When it lands

- `CLAUDE.md`, the archipelago section: record the showcase, the one new
  event, and that the island placement is deliberately unchanged.
- `UPCOMING-FEATURES.md`: an "R17" entry. Keep the three measured reasons the
  old replay was invisible — that diagnosis is the part a future session
  cannot re-derive.
- Delete this file once it is folded into `UPCOMING-FEATURES.md`.
