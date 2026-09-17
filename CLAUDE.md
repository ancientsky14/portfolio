# Portfolio — project instructions

Personal portfolio for Jan Luigi Rivera. Positioning (changed 2026-09-10):
**full-stack product developer — web apps, desktop apps, multi-site
platforms**. Audience: businesses and startups, employers and recruiters, and
any client including government — but government is *where he started*, not
the niche. Lead with what was engineered, never with who bought it.

Four case studies in `content/work/`, in this order: eBudget (Tauri desktop
app), LMIS (legislative portal + CMS), SENTRO (open-source platform), eTracker
(tracking portal). Facts in each were checked against the sibling repos in
`D:\Dev\AI\Projects` on 2026-09-10.

Next.js 16 · TypeScript · Tailwind v4 · GSAP · Three.js (Phase 5).

## Read these first

- `PHASE-1.md` — content and identity, and what's still blocked
- `PHASE-2.md` — what the scaffold is and how it was verified
- `PHASE-3.md` — the V1 landing sections, and the three gated on Jan
- `PLAN-V2.md` — **the current plan.** The shell redesign, what was and was
  not copied from the reference site, and the GSAP/three.js layer
- `content/positioning.md` — the line, the proof strip, the voice rules
- `design/tokens.css` — **the design contract**. Read before installing anything.

## The rules that matter

**Design contract.** Components come from three registries (Magic UI,
Aceternity, 21st.dev), each shipping its own gradients, radii and easings.
Every one gets re-pointed at `design/tokens.css` at install time. Six rules,
restated at the top of that file:

1. One accent (`--color-accent`). No component keeps its own gradient.
2. Radii `0 / 6 / 12 / 20 / 28 / 999` — controls 12, cards 20, the outer
   `.frame` containers 28. (Widened on purpose to match the reference shell.)
3. One border: 1px `--color-line`. Only `.frame` gets a gradient edge.
4. One shadow: `--shadow-soft` (`shadow-soft`), on cards and frames only,
   plus the focus ring and the rail portrait's drop-shadow (`.portrait`).
5. One easing (`--ease-out` / GSAP `expo.out`), three durations (`lib/motion.ts`).
6. One showpiece per viewport.

There is a **kill list** in `design/tokens.css` — twelve components that read
instantly as "AI-generated portfolio". Don't install them.

**Motion division of labour** (see `lib/motion.ts`):

- GSAP owns scroll-scrubbed timelines, pinning, the hero sequence, SplitText,
  DrawSVG, Flip. ScrollTrigger is **not loaded** (R9b, 2026-09-14): nothing
  created a trigger — reveals use IntersectionObserver — so it was dead
  weight. Register it again only together with a real trigger.
- `motion` owns whatever ships inside a library component — hover, mount.
- **Never both on the same property of the same element.** To GSAP a library
  component, wrap it in a plain `div` and animate the wrapper.
- Smooth scroll is **Lenis, not ScrollSmoother**. ScrollSmoother transforms the
  content element, which desynchronises native scroll from what the viewer sees
  (breaking `motion`'s IntersectionObserver triggers) and makes `position: fixed`
  children fix to the content rather than the viewport — which is where the
  WebGL canvas lives. Do not switch this without re-reading that reasoning.

**Truthfulness gates — do not work around these.**

- `displayClient()` in `lib/content.ts` renders `clientAnonymous` until a case
  study's frontmatter sets `clientCleared: true`. That boolean flips only when
  there is written permission from the client. Never hardcode a client name.
- `realMetrics()` drops any metric whose `value` is `null`. Never fill a null
  metric with an estimate or a plausible-looking figure to make a section look
  complete — cut the tile instead. A government buyer who catches one inflated
  number discounts the whole site.
- `<!-- NEEDS: ... -->` blocks in `content/work/*.mdx` mark things only Jan can
  answer. Don't invent answers; leave them and say what's missing.
- Case-study frontmatter also separates CONFIRMED / INFERRED / NEEDS in a
  comment block at the top. INFERRED lines are guesses awaiting correction.

**Accessibility is not a Phase 7 problem.** Every scroll animation needs a
reduced-motion *end state*, written at the same time as the animation — not an
absence of animation. Anything parked at `opacity: 0` waiting for a ScrollTrigger
must be reset in the `gsap.matchMedia()` reduce branch.

## Where the build is — V2

The plan changed on 10 Sep 2026. V1 was a dark, ten-section landing scroll.
V2 is a **light-first shell**: a persistent left rail and a scrolling panel,
following the structure of portfolio.brewedops.cloud with Jan's own content
and palette. Read `PLAN-V2.md` before changing layout or tokens.

| | | Status |
|---|---|---|
| 1 | Content & identity | drafts in, NEEDS blocks open |
| 2 | Foundations | **done** |
| 3 | V1 landing | superseded — sections moved to routes |
| R1 | Shell: rail, panel, mobile bar, theme | **done** |
| R2 | Home: hero, tools marquee, bento | **done** |
| R3 | Routes: work, services, lab, about, contact | **done** |
| R4 | Motion: Lenis + GSAP | **done** |
| R5 | Archipelago hero — three.js point cloud | **done** |
| R6 | Pages export, socials + icons, MDX bodies, brief form, re-tokenized registry pieces | **done** |
| R7 | Repositioning — product developer, eBudget added, drafts corrected | **done** |
| R8 | Reference shell + components — panel scroll, work viewer, tab bar, intro | **done** |
| R10 | Layout pass for phones and laptops — nothing clipped, the tab bar steps aside, 40px touch targets, capped measure | **done** 2026-09-16, `UPCOMING-FEATURES.md` "R10" |
| R11 | Responsive type scale — the phone ratio, measured at 360px | **done** 2026-09-16, `UPCOMING-FEATURES.md` "R11" |
| R12 | Mobile shell — full name, portrait in the bar, one CTA, footer band | **done** 2026-09-16, `UPCOMING-FEATURES.md` "R12" |
| R13 | Sitemap, the 360px overflow, per-page counts, one LCP dead end | **done** 2026-09-16, `UPCOMING-FEATURES.md` "R13" — deployed and verified live |
| R14 | Asset weight — LMIS tour 7.4→2.9MB, tool mark −50% | **partial** 2026-09-16: `public/` 13.9→9.7MB. **sentro's tour is 48% blank and needs re-recording** — `UPCOMING-FEATURES.md` "R14" |
| R15 | /about was clipping 152px of itself; the overflow check that missed it | **done** 2026-09-16, `UPCOMING-FEATURES.md` "R15" |
| R16 | Socials once per viewport — rail from lg, footer below it | **done** 2026-09-16, `UPCOMING-FEATURES.md` "R16" |
| R17 | Archipelago showcase — the shell steps aside, the field resolves from nothing | **done** 2026-09-17, `UPCOMING-FEATURES.md` "R17" |
| R18 | Touch — drag to part the islands during the showcase | **done** 2026-09-17, `UPCOMING-FEATURES.md` "R18" — verified on a real Android phone |
| R19 | Touch parts the islands on every page — touch events, so it survives a scroll | **done** 2026-09-17, `UPCOMING-FEATURES.md` "R19" |
| R9 | Hardening — budgets, keyboard + contrast pass (OG image done in `UPCOMING-FEATURES.md` Phase 1) | **partial** 2026-09-14: a11y 100, JS/CLS met; LCP 2.2–2.6s, Performance 70–79, real Android unmeasured. R9b profiled it: the floor is Next/React hydration, not site code — `UPCOMING-FEATURES.md` "R9", "R9b" |

### The shell

- `app/layout.tsx` composes `Rail` (≥lg), `MobileBar` + `TabBar` (<lg), the
  panel and `PanelFooter`. **On desktop the page never scrolls**: the rail and
  the panel (`#panel`, `.panel-scroller`) are two independent scroll areas,
  as on the reference. Below lg the window scrolls. Anything that listens to
  scroll — Lenis, every ScrollTrigger, the hero canvas — must get its
  scroller from `panelScroller()` in `lib/scroller.ts`, never assume the
  window. Route changes reset the panel's scroll in `page-motion.tsx`.
- **The home page does not scroll from 1100px wide and 780px tall** (`.home-fit` in
  `design/tokens.css`): head, tools strip and bento fit the window, the
  bento's two rows split the leftover height, and the panel is pinned via
  `:has(.home-fit)` — no JS. Its footer is hidden there. Anything added to
  the home page must fit that grid or it will be clipped.
  The height floor was 600px until R10 (2026-09-16), when measuring showed
  the bento cutting 30–231px of content on every laptop — a sliced "SENTRO",
  a chopped client card. Two rules now hold: **a fitted card shows whole rows
  and hides the rest** (`data-fit` on the lists, counts in tokens.css), and
  below 780px tall the fitted layout is off and the page scrolls with every
  card complete. Adding a row to a bento card means re-running the sweep in
  `UPCOMING-FEATURES.md` "R10", not eyeballing it.
- The mobile tab bar slides away while the reader scrolls down, returns on
  scroll up, at the top, and within 64px of the document end (R12) — the
  panel reserves a band under the footer for the bar, so down there it covers
  nothing and hiding it just left that band visibly empty. It steps aside
  while a form field has focus (R10) — it used to sit on top of content at
  rest. It never moves under reduced motion: a nav that vanishes is worse
  than one that overlaps for anyone who cannot track the movement.
- **Below lg the header carries identity, search and theme — nothing else.**
  It had a "Get in touch" pill until R12 (2026-09-16, Jan's call): it was the
  third copy of that link on the home screen, after the hero button and the
  tab bar's permanent Contact, and its 79–95px is what truncated the name to
  "Jan Luigi Ri…" on a 360px phone. The tab bar is the mobile CTA; don't add
  the pill back. The bar shows the rail's photo at 36px (`.avatar-mark`),
  since the rail itself is hidden there.
- Reference components (2026-09-11, Jan's request): the `/work` gallery with
  its card → modal viewer, the mobile tab bar, and the first-visit boot
  intro (`html.is-intro`, set by the boot script). The intro overrides the
  "motion never delays the message" rule by Jan's decision — keep it gated
  (session-once, reduced motion off) rather than widening it. Its timers
  (`INTRO` in `lib/motion.ts`) run in the inline boot script, from
  navigation start — never from hydration, which on a slow phone kept the
  page hidden up to 3s (R9). A cursor ring
  was built and then removed at Jan's request (2026-09-11); do not re-add.
- The rail portrait (2026-09-11) is a transparent cutout, `public/avatar.webp`
  (512², metadata stripped), with layered depth after the reference — glow,
  drop-shadow, shoulder fade (`.portrait` in `design/tokens.css`) — and a
  pointer tilt in `page-motion.tsx`. The original photo stays in gitignored
  `tmp-shots/`; never commit it (EXIF). It is not a 3D model; do not add one.
- A generic check badge sits beside Jan's name in the rail and the mobile bar
  (2026-09-13, `components/shell/verified-badge.tsx`), army green from the
  `--verified` token. It is **never** a platform's verified mark (Meta, X):
  that would claim a verification that does not exist.
- Side padding is `px-5 sm:px-8 lg:px-12`, set by the section or by
  `components/site/container.tsx`. Do not add horizontal padding elsewhere.
- Light is the default theme. Dark lives under `.dark` on `<html>`, set
  before paint by the inline script in the layout and toggled from the rail.
- Nav is defined once, in `components/shell/nav-links.ts`.

### Motion

All of it is in `components/motion/page-motion.tsx`, mounted once — through
`page-motion-lazy.tsx` (`next/dynamic`, `ssr: false`), so GSAP, its plugins
and Lenis (~70KB gzip) load after hydration, not in first-load JS (R9: that
took first-load JS from ~218 to ~153KB). Keep it that way: never import
`gsap` or `lenis` from a component in the first-load bundle. Pages stay
Server Components and opt in with attributes:

- `data-reveal` — rises and fades on entry
- `data-reveal-group` — direct children, staggered
- `data-reveal-depth` — on a group: children also scale up from 0.94
- `data-split` — a heading whose lines rise through a mask on load (SplitText)
- `data-tilt-card` / `data-tilt-icon` — the card tilts and lifts toward the
  pointer; its icon tile turns
- `data-magnetic` — a button pulled a few px toward the cursor
- `#process-spine` (/services) — drawn as the panel scrolls (DrawSVG)
- `data-flow` — a diagram whose `[data-flow-path]` connectors carry travelling
  dots (MotionPath), pulsing the `[data-flow-node]` each reaches; still under
  reduced motion. /services content (method, services, the eBudget update flow)
  lives in `lib/services.ts` with a receipt per line.

Page transitions (2026-09-11): an internal link click fades the page out
while the background scatters (`BG_EVENT` in `lib/motion.ts`), then
navigates; the new page rises in as the field regathers. Hovering a tilt
card or magnetic button makes the islands lean toward it, and a fast scroll
ripples them. Tilt, magnetic and attract are fine-pointer only. Under
reduced motion none of it runs, the spine is fully drawn and every element
is in its end state.

Do not add `"use client"` to a section just to animate it. If a section needs
motion the attributes cannot express, animate it from `page-motion.tsx` with
a selector, or wrap it in a plain `div` and animate the wrapper.

### The archipelago background

`components/hero/archipelago.tsx` is the gate; `archipelago-canvas.tsx` is
raw three.js (no react-three-fiber). It does not mount under reduced motion,
absent WebGL, Save-Data, 2g, or <4GB device memory. Since 2026-09-11 (Jan's
request) it is the background of every page: mounted once in `app/layout.tsx`
as a fixed, full-window `-z-10` layer behind the shell; the island chain sits
on the right (behind the bento) at low opacity, centred on phones, with a thin
dust across the window; pointer repulsion read from the window, and a gentle drift
with the panel's scroll. Without it the page is the plain ground; the hero
keeps its colour wash. The islands are procedural
and are **not** a map of the Philippines — see the header comment in
`lib/archipelago.ts` before changing that.

**The showcase** (R17, 2026-09-17). "Watch it assemble" on `/lab` and
`/lab/archipelago` (`components/lab/bg-replay.tsx`) dims everything marked
`data-showcase-dim` to 8% and makes it `inert`, sends `BG_EVENT.showcase`,
and the canvas comes up to 0.95 and resolves from nothing; timings are
`SHOWCASE` in `lib/motion.ts` — a 10s show (0.4 out, 5 assemble, 4.6 hold)
and a 3s return, Jan's timing 2026-09-17. The assemble and the return ease
**in-out** (`E_INOUT`, `--ease-in-out`): on expo.out a 5s assemble reads as a
1s snap and a 3s return as done in under one. The return transition lives
only on the short-lived `bg-showcase-return` class, never on the resting
element — a resting transition out-ranks the boot intro's own
`[data-intro="tabbar"]` fade and slows the tab bar's first-visit entrance.
Dim, never blank — Jan's call. Mark any new
piece of fixed chrome `data-showcase-dim`, or it will sit at full strength
over the show and stay tabbable. Two rules the tests hold it to: the exit is
portalled to `<body>` and returns focus to the trigger, and a dismissing tap
listens for `click` in capture, **not** `pointerdown` — pointerdown restored
the shell before the click landed, which navigated to whatever link was
under the finger. Opacity only on the shell: a transform would capture its
`position: fixed` descendants. The island placement is unchanged.

**A finger parts the islands on every page** (R19, 2026-09-17; R18 had it in
the showcase only). Jan verified R18 on a real Android phone first. Rules the
code holds to:

- **Touch uses touch events, not pointer events** — passive
  `touchstart`/`touchmove`/`touchend`/`touchcancel`. On an ordinary page the
  browser owns panning and fires `pointercancel` the moment a drag becomes a
  scroll, which killed the hole a few pixels into every scroll. Touch events
  keep firing through a scroll, and passive listeners cannot delay it. The
  mouse stays on pointer events filtered to `pointerType === "mouse"`. Split
  by input, never by media query — touch laptops send both.
- One tracked finger (its `identifier`); a pinch's second finger is ignored.
- A held finger is re-mapped **every frame**, not only on touchmove, or the
  hole slides out from under a still finger while the field keeps drifting
  after a scroll.
- A touch fades in and out *in place* via `uPush` rather than easing `uMouse`
  from off-screen (which flew the hole in from a corner); the push scales with
  `uReach`, so a fingertip gets the mouse's soft dent, not a hard empty disc.
- In the showcase, `touch-action: none` is scoped to `html.bg-showcase` so the
  dimmed page cannot scroll under a drag, and **a tap is short AND still**
  (<350ms, <10px) — holding a finger on the islands and lifting it used to end
  the show.

Off the showcase the effect is subtler by nature, not broken: the field is
faint and sits behind opaque cards, so it shows in the gaps. Device tilt was
rejected: iOS requires a motion-permission prompt.

## Conventions

- Server Components by default; `"use client"` only where interaction requires it.
- Side padding is set once, in `components/site/container.tsx`. Don't add
  horizontal padding elsewhere.
- Type scale and colours come from tokens — no arbitrary Tailwind values like
  `text-[17px]` or `bg-[#111]`.
- **A `grid` always needs a base `grid-cols`, not only a `sm:`/`lg:`/`xl:` one.**
  Below that breakpoint the element gets an implicit `auto` track, which may
  not shrink below its contents' min-content and is free to exceed its
  container — and with `overflow-hidden` it clips the excess in silence.
  Reach for `grid-cols-[minmax(0,1fr)]`. This has now caused the same bug
  twice (R13 `/contact/`, R15 `/about/`, which cut 152px off itself from 360
  through 1024 for four releases). Related trap: **`truncate` sets
  `white-space: nowrap`, so the element contributes its *full* width to
  intrinsic sizing even though it renders ellipsised** — `min-w-0` on the
  parent lets the flex item shrink but does not undo that.
- **Checking for overflow, `documentElement.scrollWidth` is not enough.** It
  cannot see content clipped by an ancestor's `overflow: hidden`, which is
  exactly how R15 hid from four sweeps. Also compare every grid's summed
  `grid-template-columns` against its own content box — see
  `UPCOMING-FEATURES.md` "R15".
- **The type scale is responsive; a heading takes one class.** The `--text-*`
  tokens step from a 1.18 phone ratio to the 1.26 desktop ratio at 40rem
  (`design/tokens.css`), so `text-2xl` is already 28px on a phone and 36px on
  a laptop. Do **not** add an `sm:text-` step to get a smaller phone size —
  that stacks two step-downs. The existing `sm:`/`lg:` steps on the page h1s
  are deliberate: they raise the desktop end past the token step, not lower
  the phone end. The scale lives in a plain `@theme`, not the `@theme inline`
  block above it, because `inline` bakes the literal value into the utility
  and the media query would never reach it.
- `three` is installed and reaches the browser **only** through the dynamic
  import in `components/hero/archipelago.tsx`. Never import it anywhere that
  the main bundle can reach. `@react-three/fiber` and `@react-three/drei` are
  deliberately not installed — one point cloud does not need a reconciler.

## Deployment — GitHub Pages (static export)

`next.config.ts` sets `output: "export"`, `trailingSlash: true` and a
`basePath` from `NEXT_PUBLIC_BASE_PATH` (`/portfolio` in CI, empty locally).
`.github/workflows/deploy.yml` builds and publishes on every push to `portfolio`.
The repo was renamed from `Portfolio` on 2026-09-14: Pages paths are
case-sensitive, the old URL 404s rather than redirecting, and a rename means
changing both env values in the workflow.

What that rules out — do not add any of these: request-time Route Handlers,
Server Actions, `resend`, cookies, redirects/rewrites/headers, ISR,
`next/image` optimisation, dynamic routes without `generateStaticParams`.
Metadata routes (`sitemap.ts`, `robots.ts`) need `export const dynamic =
"force-static"`.

The one allowed Route Handler kind is a `force-static` GET that the export
turns into a file — `app/og/[card]/route.tsx`, amended with Jan on 2026-09-14.
Nothing runs when a visitor requests it.

The contact form (`components/contact/brief-form.tsx`) has two modes, fixed at
build time. With `SITE.contactApi` and `SITE.turnstileSiteKey` both set
(`CONTACT_SENDS`), it POSTs to the `portfolio-contact` Worker
(`workers/contact/`: Turnstile, D1, Gmail SMTP, three sends an hour, messages
deleted after 30/90 days). Otherwise it composes the email in the visitor's
own mail client. When sending fails (a failed Gmail send is a 502, never
200) the form never says "Sent": it offers the brief as a mailto link and a
copy button the visitor clicks. Both write
the same email through `lib/brief.ts`, whose `validateBrief()` is also the
Worker's guard against header injection: keep one-line fields free of
control characters.

The `portfolio-visits` Worker (`workers/visits/`, `SITE.visitsApi`) counts two
things, both keyed by the same unreversible visitor hash — SHA-256 of a secret
salt, the Manila day, the IP and the user agent, deleted nightly after two
days, no cookies:

- `POST /hit` — one visit per browser session; `GET /count` feeds the single
  number in the rail. The total carries a **+3,000 display offset**
  (migration 0002). Real visits = count − 3000.
- `POST /view?p=` — one page read per visitor per day per path (migration
  0003, R13). **Nothing on the site displays it and there is no read
  endpoint**; the breakdown is read with `wrangler d1 execute` — the command
  is in the migration. These rows carry no offset. The path comes from the
  browser and is matched by shape in `okPath`, so a new case study needs no
  Worker deploy — keep it that way rather than listing slugs.

### Share cards, search-engine data, booking (2026-09-14)

- **Share cards** are `app/og/[card]/route.tsx` → `out/og/site.png`,
  `work-<slug>.png`, `lab-<slug>.png`; layouts and fonts in `app/_og/`, ids
  and `openGraphFor()` in `lib/og.ts`. **Not** the `opengraph-image.tsx`
  convention: its export is an extensionless file, which Pages serves as
  `application/octet-stream` and Facebook rejects, and under `[slug]` it
  cannot get its params. The card colours are hard-coded light tokens — change
  a token, change `app/_og/cards.tsx`.
- **JSON-LD** builders are in `lib/structured-data.ts`, rendered by
  `components/site/json-ld.tsx`: `Person` in the layout, `CreativeWork` per
  case study, `TechArticle` per lab note. Case studies are deliberately not
  `SoftwareApplication` — Google requires a price and a rating for it, and
  the site states neither.
- **Book a 30-min call** (`components/site/book-call.tsx`) renders only when
  `SITE.bookingUrl` is an https link. In the fitted home hero it sits on its
  own row (`.home-fit__actions`) — three buttons in one row broke the
  headline onto four lines.

### Case-study bodies — a second truthfulness gate

`app/work/[slug]` renders the MDX body through `prepareBody()` in
`lib/mdx.ts`, which strips `<!-- NEEDS -->` (a hard MDX syntax error) and the
`{/* */}` ledger, and drops headings left empty. `bodyVisibility()` then:
renders in `next dev` under a draft banner; renders in production **only**
when the frontmatter has `bodyReviewed: true`. Never set that flag on
Jan's behalf — the drafts contain INFERRED prose.

### Search — Ctrl+K (2026-09-16)

`lib/search-index.ts` builds ~22 entries at build time (nav, case studies
through `displayClient()`, lab notes, services, and the contact actions that
exist). `lib/search.ts` holds the entry type, `PALETTE_EVENT` and the
matcher — browser-safe, no `cmdk` or `fuse.js`.
`components/shell/search-launcher.tsx` is the only part in first-load JS:
it listens for Ctrl+K / ⌘K and the buttons in the rail and mobile bar
(`search-button.tsx`), then loads `command-palette.tsx` with `next/dynamic`
on first open. Keep it that way — the palette is never imported directly.
The palette follows the work viewer: portal, locked scroller,
`data-lenis-prevent`, focus returned on close.

### Registry components

Magic UI Dot Pattern → `components/ui/dot-pattern.tsx`, Magic UI Scroll
Progress → `components/ui/scroll-progress.tsx` + CSS, Aceternity Card
Spotlight → `[data-spotlight]` + one listener in `page-motion.tsx`. Each was
rewritten against the tokens rather than installed with `shadcn add` — the
CLI edits `app/globals.css`, and the originals carried their own gradients,
per-dot DOM nodes, or a react-three-fiber dependency. The header comment in
each file says what changed. Do the same for anything added later.

### Socials and icons

`lib/socials.ts` is the one list (GitHub, LinkedIn, Facebook, Discord);
`components/shell/social-links.tsx` renders it. Brand marks come from
`@icons-pack/react-simple-icons` (LinkedIn inlined — it is not in Simple
Icons), UI icons from `lucide-react`. All render in `currentColor`: one
accent, never brand colours — except the home tools marquee, which Jan asked
to show each tool in its own colours (2026-09-11): `<ToolIcon brand>`, with
official marks for Simple Icons' gaps in `public/icons/tools/` (devicon and
lobehub icons, both MIT).

**The socials appear once per viewport: the rail from lg up, the panel footer
below it** (`lg:hidden` on the footer's copy, R16). They were also in the
`/about` hire block, which put two rows 283px apart on a phone and 142px apart
at 1280 — measured across every page, not eyeballed. `/contact` is the one
deliberate exception: a card each, with the handle and a note, as the
destination for "find me here". Don't add a third copy to a page section.

## Commands

```bash
npm run dev
npm run typecheck
npm run build
```

## Budgets (Phase 7, but design toward them)

LCP < 2.0s on 4G / mid-range Android · CLS < 0.05 · INP < 200ms ·
main JS < 200KB gzip · three chunk < 500KB lazy · Lighthouse ≥ 95 perf, 100 a11y.

Test on a real mid-range Android on a throttled connection, not a laptop. The
buyers open this outside Metro Manila on mobile data.

## Open questions

Resolved 2026-09-10 from the repos: LMIS = Legislative Management Information
System; BarangayOS author and MIT licence verified in `sentro/LICENSE`; SENTRO
status = in development (sync engine is roadmap Phase 2, not built — never
claim it works offline).

Resolved 2026-09-11 by Jan: headline signed off; contact email and
availability wording confirmed; MGB RO1 and Santol may be named
(`clientCleared: true` on eBudget, eTracker, LMIS); eBudget does **not** work
offline since the Postgres move (metric cut — never claim it).

Changed later on 2026-09-11 by Jan: the ownership step and the "working
session before a price" step are removed. **Do not state ownership or
payment terms anywhere on the site.** The process is four steps (fixed
scope, staging link, training, updates after launch), the home card is
"Updates", and sector labels are neutral — the Built for strip says
"Client", not a government sector.

Still open:
1. Why the Vercel → Cloudflare Workers move, with numbers if available?
2. `public/cv.pdf` — a **web copy**: no street address or phone, no
   unmeasured percentages, metadata stripped (Jan, 2026-09-14; see
   UPCOMING-FEATURES.md 1.3). **Published 2026-09-14.** Never publish the
   full CV; a new export goes through the same metadata clean. The booking
   link is set (2026-09-14).
3. Any testimonial at all — if none, keep the section cut rather than fake it.
4. Case-study bodies: `bodyReviewed: true` only once Jan has read each draft.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
