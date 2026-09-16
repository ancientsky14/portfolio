# Upcoming features

A self-contained build plan, written 2026-09-13 so the work can continue on
another PC (and in a fresh Claude Code session that has none of the earlier
conversation). Read [CLAUDE.md](CLAUDE.md) first — its rules apply to every
phase below: design tokens only, a reduced-motion end state for every
animation, no invented numbers or quotes, static export (no request-time
Route Handlers, no Server Actions, no middleware).

Build in phase order. Each phase is independently shippable.

| Phase | Feature | Needs from Jan |
|---|---|---|
| 1 | Share preview images, search-engine data, CV button, Book-a-call — **built 2026-09-14**, booking link set, CV published | LinkedIn/GitHub hyperlinks in the CV |
| 2 | Contact form that really sends (Gmail SMTP) — **live 2026-09-14** | Gmail App Password, Turnstile keys |
| 3 | Testimonials | Real quotes + written permission |
| 4 | Ctrl+K search — **built 2026-09-16** | — |
| 5 | Tagalog / English on key pages — **dropped 2026-09-16**, browsers translate | — |

---

## 0. Resume on a new PC

**State as of 2026-09-13** (branch `portfolio`, deployed to
https://ancientsky14.github.io/portfolio/ by `.github/workflows/deploy.yml`
on every push; the repo was `Portfolio` until 2026-09-14 — Pages paths are
case-sensitive and the old URL does not redirect):

- Case studies have live links, build-time status, tour recordings and
  screenshots (`lib/live.ts`, `lib/shots.ts`, `components/work/`).
- The rail shows a live visit count from the `portfolio-visits` Cloudflare
  Worker in `workers/visits/` (D1, Jan's own Cloudflare account). GoatCounter
  was removed.
- Capture scripts live in `scripts/capture/`; video re-encoding in
  `scripts/media/reencode.mjs`.

**Set up the office PC:**

```bash
git pull
npm install
cd workers/visits && npm install && cd ../..
npm run dev
```

- Log in to Cloudflare only when a phase needs it: `cd workers/visits && npx wrangler login`
  — Jan's **own** account, never a client's (Santol's Workers live elsewhere).
- `workers/visits/.dev.vars` is gitignored, so it does not come with `git pull`.
  Recreate it for local Worker testing:

  ```
  VISIT_SALT=local-dev-salt-not-for-production
  HIT_ORIGINS=https://ancientsky14.github.io,http://localhost:3000
  ```

**Known gotchas:**

- If `npm run build` fails with
  `.next/dev/types/validator.ts(...): error TS1128`, a dev server left a
  half-written generated file. Stop `npm run dev`, run `rm -rf .next/dev`,
  build again. It is not a source error and does not affect CI.
- Never run `npm ci` while `npm run dev` is running (Windows). `npm ci`
  deletes `node_modules` first, then stops with `EPERM: operation not
  permitted, unlink ...\next-swc.win32-x64-msvc.node` because the dev server
  holds that file — leaving most packages gone. Stop the dev server first. If
  it has already happened, `npm install` restores the tree in place without
  touching the lockfile (seen 2026-09-14).

**Commands Jan runs himself** (see his global instructions): `npm run build`,
`git commit`, `git push`, any database push (`wrangler d1 migrations apply
--remote`), `wrangler deploy`, `wrangler secret put`. Claude prepares the
change and hands over exact commands.

**Prompt to start a phase in Claude Code:**

> Read UPCOMING-FEATURES.md and CLAUDE.md, then build Phase N. Follow the
> plan's file list and verification steps, and hand me the commands I run.

---

## Phase 1 — Quick wins

### 1.1 Share preview images (Open Graph)

**Why.** A link pasted into Messenger, Viber, LinkedIn or Facebook currently
shows a blank card. Buyers share links internally; the card is the first
impression.

**Built** — but not with the `opengraph-image.tsx` convention this section
first planned. Reading Next 16.3's export code showed two problems with it:

- A generated `opengraph-image` exports as an **extensionless** file
  (`out/opengraph-image`, see `node_modules/next/dist/export/index.js`,
  `handlerDest`). GitHub Pages serves that as `application/octet-stream`, and
  Facebook's crawler rejects an og:image with that content type.
- Under `app/work/[slug]/`, the image route's static params come only from
  its own file, and the loader's generated `generateStaticParams` fills just
  `__metadata_id__` — `slug` would be missing in the export.

What shipped instead (Jan chose it, 2026-09-14):

- `app/og/[card]/route.tsx` — a `force-static` GET with `dynamicParams =
  false`. `generateStaticParams` returns `site.png`, `work-<slug>.png`,
  `lab-<slug>.png`; the `.png` in the param becomes the file's extension.
  Static export supports this officially; nothing runs at request time.
  CLAUDE.md's "no Route Handlers" line now reads "no request-time Route
  Handlers".
- `app/_og/cards.tsx` — the three layouts (site: role, name, `SITE.line`,
  availability; case study: title, `fullName`, subtitle, platform/status/
  version pills, the tour poster; lab: kind · year, title, blurb). Light-token
  hex values, one accent, no figures.
- `app/_og/fonts/` — Bricolage Grotesque 800 (opsz 96), Public Sans 400/600,
  JetBrains Mono 600 as static TTF, with their OFL licences.
- `lib/og.ts` — card ids and `openGraphFor(id, alt)`; `lib/shots.ts` —
  `posterFile(slug)`. The layout sets the site card; case-study and lab pages
  set their own. Next fills og:title/description and the twitter tags from
  each page's own title and description.

Checked in `next dev` on 2026-09-14: all seven cards render (largest 340 KB),
an unknown id is a 404, the pages carry the right og:image, and Next's own
`resolveUrl` turns `/og/site.png` into
`https://ancientsky14.github.io/Portfolio/og/site.png` with the CI
`metadataBase`.

**Verify.** `npm run build`, then `out/og/` holds `site.png`, four `work-*.png`
and three `lab-*.png`. After deploy: `curl -I
https://ancientsky14.github.io/portfolio/og/site.png` says `content-type:
image/png`, and a case-study URL pasted into the Facebook Sharing Debugger
shows its card.

### 1.2 Search-engine data (JSON-LD)

**Why.** Helps Google show Jan's name, profiles and projects correctly.
Invisible on the page.

**Built.** Builders in `lib/structured-data.ts`, rendered by
`components/site/json-ld.tsx` (escapes `<`):

- `app/layout.tsx` — `Person`: name, url, email, jobTitle (`SITE.role`),
  `sameAs` from `lib/socials.ts`, the avatar, `addressCountry: PH`.
- `app/work/[slug]/page.tsx` — **`CreativeWork`, not `SoftwareApplication`.**
  Google's Software App result *requires* `offers.price` and a rating or
  review; without them the Rich Results Test marks the item invalid, and the
  site states neither. Carries name, alternateName, headline (subtitle),
  description (summary), author, `dateCreated` (year), keywords (stack), and
  `about` with the cleared live link from `liveLinks()` when there is one.
- `app/lab/[slug]/page.tsx` — `TechArticle`.

Rules: only facts already on the page. No ratings, reviews or client names
that are not `clientCleared: true`.

**Verify.** Paste a deployed URL into https://search.google.com/test/rich-results
— no errors.

### 1.3 Downloadable CV

**Already built.** `cvHref()` in `lib/cv.ts` renders the "Download CV" button
on `/about` as soon as `public/cv.pdf` exists.

**Jan does:** export the CV to PDF and strip its metadata (author, software,
edit history): in Adobe Acrobat *File → Properties* and *Save As*, or with
`exiftool -all:all= cv.pdf` **followed by** `qpdf --linearize cv.pdf
cv-clean.pdf`. ExifTool's PDF edits are an incremental update — reversible
by design — so without the qpdf rewrite the old metadata is still in the
file. Save the result as `public/cv.pdf`.

**2026-09-14 — the public copy is a web version.** The first file
(`CV_Resume.pdf`) was not used:

- it carried the home barangay and a personal mobile number;
- it said "Rust.js";
- it had unmeasured percentages;
- its Title metadata named the job it was written for;
- it was made with Microsoft Print to PDF, which drops links.

Jan decided: no street address or phone, and percentages only where measured,
exported with Word *Save As → PDF* with *Document properties* unticked. No
exiftool or qpdf on the office PC: Claude rewrites the file with pdf-lib,
removing `/Info` and `/Metadata` and the objects they point to, as a full save.
The About button downloads it as `Jan-Luigi-Rivera-CV.pdf`.

**Published 2026-09-14.** `public/cv.pdf` is the pdf-lib rewrite of Jan's
Word export (kept locally in gitignored `tmp-shots/CV_Resume.pdf`).
Verified:

- no `/Info` keys, no XMP, no Word `PieceInfo`, one `startxref`;
- no EXIF in the photo;
- no phone and no barangay in the text;
- tagging and `Lang` kept, and it renders the same;
- served as `application/pdf`, and `/about` shows the button.

Open item: in the Word file, "LinkedIn" and "GitHub" are styled like links
but only the email is a real hyperlink. Add the hyperlinks in Word, export
again, and re-run the clean.

**Verify.** `/about` shows the button; the download opens the PDF.

### 1.4 Book-a-call button

**Why.** Clients who are ready want a slot, not an email thread.

**Built.** `SITE.bookingUrl` (null, NEEDS) drives
`components/site/book-call.tsx` — the outline pill, `data-magnetic`, new tab,
rendered only for an https link — in three places:

- the home hero, after "Hire me". From 1100px it sits on its own row under
  the other two (`.home-fit__actions` in `design/tokens.css`): three pills in
  one row took the headline's width and broke it onto four lines at 1100 and
  1280px. Measured with a placeholder link: the headline stays on two lines
  at 1100×600, 1280×720 and 1536×864; the bento gives up 12px at 1100×600
  only; the home page still does not scroll.
- `/services` — under the header line. The page had no CTA of its own.
- `/contact` — beside "Email me".

**Set 2026-09-14:** `https://cal.com/jan-luigi-rivera-4zm6eu/30min` — the
event page, not the profile Jan sent (which also lists a 15-minute event).
Changing the Cal.com username later breaks this link; update it here too.

**Verify.** Button appears in all three places once set; hidden while null.

---

## Phase 2 — Contact form that really sends (Gmail SMTP)

**Why.** `components/contact/brief-form.tsx` builds a `mailto:` link, so it
depends on the visitor having a mail app configured — many give up there.

**Decision.** Gmail SMTP from a Cloudflare Worker (Jan's choice). Workers can
open outbound TCP sockets (`cloudflare:sockets`); port 25 is blocked but
**465 (TLS) and 587 work**. Use the `worker-mailer` npm package (SMTP client
for Workers) — check its README for required `compatibility_flags` before
installing. Gmail consumer limit is roughly 500 recipients a day.

**Built 2026-09-14** — code complete and tested locally; it goes live when
Jan does 2.3. Until `SITE.contactApi` and `SITE.turnstileSiteKey` are both
set, the form behaves exactly as before.

### 2.1 Worker — `workers/contact/`

A separate Worker from `workers/visits`: the App Password can send mail as
Jan, so it keeps its own code and secrets.

- `src/index.ts` — `POST /contact`, in this order: Origin (403) → body size
  (413) → JSON (400) → Turnstile token present (400) → `validateBrief()` (400)
  → siteverify, hostname must be an allowed origin's (400) → at most 3 per
  salted IP hash per hour (429) → insert → send through `smtp.gmail.com:465`
  (From = `GMAIL_USER`, Reply-To = visitor) → `emailed = 1`. A failed send
  answers `502 { stored: true, emailed: false }` (was 200 until 2026-09-14,
  which showed visitors "Sent" for a brief that never arrived); the form
  then offers the brief as a mailto link and a copy button, both clicked by
  the visitor, and the row stays as the backup.
- `migrations/0001_init.sql` — `messages` as planned, plus an index on
  `(ip_hash, created_at)` for the rate limit.
- `wrangler.jsonc` — `nodejs_compat` (worker-mailer's README requires it),
  `CONTACT_DB`, `ALLOWED_ORIGINS`, `MAIL_TO`, a daily cron.
- `lib/brief.ts` (site root, bundled into the Worker) — `validateBrief()` and
  `composeBrief()`, shared with the form so the mailto: email and the sent
  email are the same text.

Where it differs from the plan, and why:

- **The form had no email field** — `mailto:` never needed one. Sending mode
  adds "Your email" (required; it becomes Reply-To). Composing mode is unchanged.
- **Header injection is the real "reject" rule.** worker-mailer writes ASCII
  header values unencoded, and the name, company and role title reach the
  Subject and Reply-To — so every one-line field rejects control characters
  (CR/LF included), and the email address is a strict pattern with no quotes,
  brackets or commas. "HTML-looking" is narrowed to markup tags and `href=`,
  so a brief can still say "budget < 1M".
- **`authType: ["plain", "login"]` is required.** worker-mailer has no
  default: without it, it throws "No supported auth method found."
- **`ALLOWED_ORIGINS` in wrangler.jsonc is the live site only**, as the
  visits Worker's `HIT_ORIGINS` is. Local testing sets
  `http://localhost:3000` in `.dev.vars`.
- **Retention (not in the plan).** A daily cron deletes emailed messages
  after 30 days and every message after 90 — the rate limit needs one hour,
  and briefs are personal data. The form says "kept at most 90 days".
- **Turnstile test secrets answer `hostname: "example.com"`** with
  `metadata.result_with_testing_key: true` (Cloudflare's docs say
  "localhost"). The hostname check is skipped only for that flag, which a
  real secret never returns.
- `TURNSTILE_SITE_HOST` was not needed — the allowed hostnames come from
  `ALLOWED_ORIGINS`.

### 2.2 Site

- `lib/site.ts` — `contactApi`, `turnstileSiteKey` (both null, NEEDS), and
  `CONTACT_SENDS` (both set).
- `components/contact/brief-form.tsx` — in sending mode: Turnstile loaded
  from Cloudflare's URL on the Contact page only (explicit render, flexible
  size, the site's theme); Send → "Sending…" → a confirmation that takes
  focus, with "Write another". A 429 shows "That's the limit for now". Any
  other failure — the Worker down, a 4xx/5xx, Turnstile blocked by an
  extension — opens the visitor's mail app with the same email and says so.
- `app/contact/page.tsx` — the intro line under "Send a brief" matches the
  mode.

Checked 2026-09-14 on the office PC (wrangler dev + test keys, and the real
form in Chromium):

- 22 `validateBrief` cases, CRLF-in-name and `<a href>` among them; the
  composed emails read right.
- Preflight from the allowed origin 204 with CORS headers, other origins
  none; wrong or missing Origin 403; bad JSON, no token, CRLF, markup and a
  bad email 400; oversized 413; always-fail secret 400 with nothing stored.
- Valid briefs 200 `{stored:true, emailed:false}` — a real TLS session with
  smtp.gmail.com:465 that Gmail answered `535-5.7.8 Username and Password not
  accepted` for fake credentials — and the 4th in an hour 429. The error log
  holds the message id, no personal data.
- The cron deleted a 40-day emailed row and a 100-day unsent one, and kept
  the recent rows and a 40-day unsent one.
- In the browser: token → Send → confirmation focused; Worker unreachable,
  429, and Turnstile blocked each show the right message and fall back.

**Deployed and verified 2026-09-14:** a brief sent from the live /contact
page passed Turnstile and was stored and emailed (`emailed = 1`). Two traps
on the way, both in 2.3 below: `wrangler d1 create` renamed the binding,
and IP_SALT was stored empty. A Gmail `534-5.7.9 Application-specific
password required` means the normal Google password was given, not an App
Password. Message 1 of that day is stored but unsent (the 534) — a test.

### 2.3 Jan does

1. Google Account → Security → turn on **2-Step Verification**.
2. Google Account → Security → **App passwords** → create one named
   "portfolio contact". Never paste it into chat or a file.
3. Cloudflare dashboard → **Turnstile** → add a widget for
   `ancientsky14.github.io` → copy the site key (public) and secret key.
   `localhost` is not needed: local testing uses Cloudflare's test keys.
4. In `workers/contact` (PowerShell):

   ```powershell
   cd workers/contact                               # NOT the repo root: there,
                                                    # `wrangler deploy` tries to
                                                    # convert the site to OpenNext
   npm install
   npx wrangler login                               # Jan's own account
   npx wrangler d1 create portfolio-contact         # paste the id into wrangler.jsonc;
                                                    # answer NO to adding a binding —
                                                    # it renames CONTACT_DB and the
                                                    # Worker answers 500
   npx wrangler d1 migrations apply portfolio-contact --remote
   npx wrangler deploy                              # deploy BEFORE secrets
   npx wrangler secret put GMAIL_USER               # the Gmail address that sends
   npx wrangler secret put GMAIL_APP_PASSWORD       # paste; input is hidden
   npx wrangler secret put TURNSTILE_SECRET
   # IP_SALT is random and never needs to be known — set it from a temp file:
   $f = Join-Path $env:TEMP "ip-salt.json"
   @{ IP_SALT = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) } | ConvertTo-Json | Set-Content $f -Encoding utf8NoBOM
   npx wrangler secret bulk $f
   Remove-Item $f
   ```

   Lesson from the visits Worker: on Windows, **piping** a value into
   `wrangler secret put` stored an empty secret. Use clipboard + paste — and
   check it took: on 2026-09-14 a paste into the IP_SALT prompt also stored
   "" (the prompt showed √). The Worker logs `contact: not configured,
   missing <NAME>` (`npx wrangler tail`) for any empty secret.
5. Send Claude the Worker URL (`https://portfolio-contact.<subdomain>.workers.dev`)
   and the Turnstile **site** key — never the secret. Claude sets both in
   `lib/site.ts`; Jan builds, commits and pushes.

Reading a brief that was stored but not emailed — check after any
`email failed` line in `npx wrangler tail` (the visitor may or may not have
sent it from their mail app):

```powershell
npx wrangler d1 execute portfolio-contact --remote --command "SELECT id, created_at, name, email, body_json FROM messages WHERE emailed = 0"
```

### 2.4 Verify after deploy

- Send a real brief from the live Contact page → it arrives in Gmail, and
  Reply goes to the address typed in the form.
- `npx wrangler tail portfolio-contact` while sending shows no `email failed`.
- A second browser without JavaScript still gets the mailto: form.

---

## Phase 3 — Testimonials

**Why.** A real quote from MGB RO1 or Santol staff is the strongest trust
signal for public-sector buyers. **Never invent or paraphrase one.**

**How.**

- `lib/testimonials.ts`:

  ```ts
  type Testimonial = {
    quote: string;          // verbatim, as approved
    name: string;
    role: string;
    organization: string;  // rendered only if the matching case study is clientCleared
    project?: string;       // work slug
    consent: boolean;       // written permission to publish name + quote
    consentDate: string;    // ISO date
    consentSource: string;  // "email from … 2026-..-..", not rendered
  };
  ```

  Export `publishedTestimonials()` → only `consent === true`.
- `components/sections/testimonials.tsx` — Server Component, token styling,
  `data-reveal-group`. Placed on `/about` and `/services`, and on the related
  case study (`project`). **Renders nothing when the list is empty** — the
  section stays cut rather than faked.

**Jan does:** ask each person for a short quote and **written** permission
(email is enough) to publish their name, role and office with it. Paste the
approved wording exactly.

**Verify.** With zero consented entries no section or heading renders; with
one, it renders on the three pages.

---

## Phase 4 — Ctrl+K search

**Why.** Quick jump across work, lab, writing and services; keyboard-friendly.

**How** (no Route Handlers — static export rule):

- `lib/search-index.ts` — Server-side builder: pages from
  `components/shell/nav-links.ts`, case studies (`getAllWork()` — title,
  `fullName`, subtitle, stack), lab notes (`getAllLab()`), services
  (`lib/services.ts`). Returns ~30 small entries.
- `app/layout.tsx` passes the index as a prop to
  `components/shell/command-palette.tsx` (client). Serialized once in the RSC
  payload — a few KB.
- Palette: opens on Ctrl+K / Cmd+K and a search button in the rail and
  mobile bar; plain substring + word-prefix matching (no `cmdk` or `fuse.js`
  — protect the 200 KB JS budget); arrow keys, Enter navigates with
  `next/link` router, Esc closes; focus trap and return focus (reuse the
  pattern from the work gallery viewer in `components/work/work-gallery.tsx`);
  `role="dialog"`, `aria-modal`, `role="listbox"`/`option`.
- Motion: open/close fade only; instant under reduced motion.
- `data-lenis-prevent` on the list, as the gallery viewer does.

**Verify.** Keyboard only: Ctrl+K → type "ebud" → Enter lands on
`/work/mgb-ebudget/`; Esc returns focus; screen reader announces results;
main JS size unchanged within a few KB.

**Built 2026-09-16.** 22 entries: pages, four case studies, three lab notes,
four services, and the actions that exist (brief, email, booking, CV).
Writing is left out while `lib/writing.ts` is empty — no pages to land on.

Where it departs from the plan above:

- **The palette is not in first-load JS.** `search-launcher.tsx` (a keydown
  listener plus the `PALETTE_EVENT` hook, wrapped in `<Optional>`) loads
  `command-palette.tsx` with `next/dynamic` on first open — one extra script
  request, measured. First-load JS moved 191.6 → 192.7 KB gzip on home
  (~154 KB excluding the `noModule` polyfill), still under budget. After R9b
  showed startup is this site's slowest part, nothing unasked-for ships.
- **Matching and entry shape live in `lib/search.ts`** (browser-safe);
  `lib/search-index.ts` reads content and stays server-only.
- **The rail row is h-9 with a tighter divider.** At h-11 the rail ran out
  of height and pushed **Contact** below the fold at 1280×720; measured
  four placements, and this one keeps the nav exactly as it was.
- **The highlighted row's hint is `text-text-2`.** In dark theme `text-3`
  on `accent-soft` measured 4.04:1 — the pairing R9 flagged as a latent
  risk. axe caught it on the open dialog; now 0 violations in both themes.
- Nav hint fixed on the way: Work said "Three systems in the field" with
  four case studies published; now "Four products, built end to end".

Verified: the flow above; ↑/↓ wrap; Tab stays in the field; Esc returns
focus to the search button; a no-match message; opening from inside a form
field; tapping a result on a phone; the top bar does not overflow at 390px;
axe 0 violations (site-wide and on the open dialog, light and dark); the
fitted home page still does not scroll at 1100×600, 1280×720 or 1536×864.

---

## Phase 5 — Tagalog / English (key pages) — **DROPPED 2026-09-16**

**Jan's decision, 2026-09-16: do not build this.** Browsers translate a page
on request, and that is enough here. Built once as `2b81104` (home page,
shell, dictionaries, EN/TL toggle), then reset out of history the same day —
it was never pushed and never live.

Why it is not worth doing:

- **A translation is a second copy of claims this site gates for truth.**
  `displayClient()`, `realMetrics()` and the NEEDS blocks exist so nothing
  overstates; a mistranslated claim is still a false claim, and every review
  would have to happen twice.
- **It only pays off if it is maintained.** Every headline, card and service
  line would have to be edited in two places forever, or the Tagalog page
  drifts from the English one without anyone noticing.
- **The audience reads English**, and the pages a Tagalog visitor would land
  on next — case studies, lab notes, the CV — are English anyway.
- **Browser translation needs one thing from us and already has it:** a
  correct `<html lang="en">`. Keep that accurate and Chrome, Edge and Safari
  offer Tagalog themselves.

**If it is ever revisited, two things cost most of the effort:**

- Only a **root layout** can set `<html lang>`, so a second language means a
  second root layout (route groups `(en)` / `(tl)`). That in turn breaks the
  global 404: with two root layouts Next has none to build it from and writes
  a bare page with no shell and no `lang`, so it needs
  `app/global-not-found.tsx` plus `experimental.globalNotFound`.
- **`notFound()` cannot hide an unreviewed page in a static export** — it
  still writes `out/tl/index.html`, a bare unstyled page at a public URL. A
  draft has to be a file the production build never sees: `pageExtensions`
  in `next.config.ts` including `draft.tsx` only in development. A static
  export also refuses a route whose `generateStaticParams()` returns nothing,
  which is the other reason a drafts-only state cannot be a normal route.

The original plan is kept below for reference only.

**Scope (Jan's decision):** Home, Services, About, Contact in Tagalog. Case
studies, Lab and Writing stay English. Claude drafts the Tagalog; **it ships
only after Jan reviews each page.**

**How** (static export: no middleware or i18n routing):

- `content/i18n/en.ts` and `content/i18n/tl.ts` — typed dictionaries
  (`satisfies Dictionary`) holding every string on the four pages plus nav
  labels, rail, footer and form labels. `tl.ts` carries
  `reviewed: { home: false, services: false, about: false, contact: false }`.
- Refactor the four pages' sections to take strings from a `dict` prop
  instead of inline literals (English output must stay byte-identical — check
  by diffing the built HTML before/after).
- Routes: `app/tl/page.tsx`, `app/tl/services/page.tsx`,
  `app/tl/about/page.tsx`, `app/tl/contact/page.tsx` — thin wrappers passing
  `tl` strings. A Tagalog page is **not generated** until its `reviewed` flag
  is true (skip it in the route, and in `app/sitemap.ts`).
- Metadata: `alternates.languages` (`en` ↔ `tl`) and `<html lang>` per route
  (`lang="tl"` on the `/tl` segment layout).
- Toggle: "EN / TL" in the rail and mobile bar, linking to the counterpart
  page (only when it exists); remembers choice in `localStorage` but never
  auto-redirects.
- Truthfulness: translate meaning, never add claims; numbers, client names and
  technical names stay as in English.

**Jan does:** read each Tagalog page in the dev server, correct it, then flip
its `reviewed` flag.

**Verify.** `/tl/` renders only reviewed pages; toggle round-trips to the
same page; `hreflang` present; English pages unchanged.

---

## R10 — Layout pass for phones and laptops (2026-09-16)

Jan asked for a better layout on phones and laptops. Measured first, at six
viewport sizes, on every main page: content clipped by a parent, controls
covered by a floating overlay, tap-target sizes, characters per line, and
what sits above the fold.

**What was wrong**

- **Laptops: the home page cut its own content.** The fitted layout applied
  from 1100×600, but the bento no longer fit at any height up to 1200px. At
  1280×800 each card had 193px and needed 220–420px: "Built for" 231px over
  (three client cards at 114px), the Work list 84px, Services 60px, Shipped
  33px, About 30px. On screen that read as a sliced "SENTRO" and a chopped
  client card.
- **Phones:** three buttons, the intro line and the email filled the first
  screen; the tools strip and the first proof card were ~1.5 screens down.
  The floating tab bar sat on content at rest (15% of a work card, 52% of a
  tools row on /about, and a form field on /contact). Its search and theme
  buttons were 29×32.
- **Both:** the home lede ran 96 characters a line at 1280, /about 89.

**What changed**

- **Fitted cards show whole rows and hide the rest.** Counts live in
  `design/tokens.css` and come from `data-fit` on each list
  (`components/home/bento.tsx`), because rows differ in height: Shipped's
  pills are one line, About's credentials wrap to two. Work's four products
  now sit in a 2×2 grid with the platform under the name — side by side they
  collided in half a column. "Built for" became one line per client instead
  of a stacked card. On the shortest fitted window (≤816px tall) Shipped
  shows two pills, since the third carries "In development" and wraps.
- **The fitted layout needs 780px of height**, not 600. Below that the cards
  fall to ~130px with 18–53px for their content, so the page scrolls instead
  and every card is whole. A 1366×768 laptop now scrolls — which is the
  honest outcome.
- **The "Signed auto-updates" badge** overflowed its card by 17px at
  1280×800 (a 48px key beside a 147px badge in 167px): both shrink now.
- **Phones:** two buttons on the fold, the booking button moved down beside
  the email (one node each, switched in tokens.css, never both), tighter
  hero spacing. The tools strip and the first card now reach the fold.
- **The tab bar** hides while scrolling down, returns on scroll up or at the
  top, and steps aside while a form field has focus. Pinned under reduced
  motion.
- **Touch and reading:** the mobile bar's search and theme buttons are 40×40
  (`shrink-0`, or a narrow phone squeezed them to 35px); a `measure` utility
  (62ch) caps the long paragraphs; the rail gained bottom padding so the
  floating accessibility button can never sit on a nav row.

**Verified** at 390×844, 412×915, 820×1180, 1280×800, 1440×832, 1680×1050 on
`/`, `/work/`, `/services/`, `/about/`, `/contact/`: zero clipped content,
no line over 85 characters, every shell control ≥ 40px, the first bento card
above the fold on a phone, the fitted home not scrolling above 780px and
scrolling cleanly below it. axe 0 violations in both themes; the keyboard
walk and reduced-motion end states unchanged; the tab bar visible and still
under reduced motion; Lighthouse with real throttling `/` 72 and `/contact/`
80 with CLS ≤ 0.003 — the same band as R9b.

**Still true, and accepted:** the tab bar covers part of a card at rest on a
phone, which is what a floating bar does; scrolling or focusing a field
moves it. The scripts (`uxaudit.mjs`, `fitsweep.mjs`, `cardcut.mjs`) live in
a session scratchpad — rebuild them from this description: walk every
element with hidden overflow and compare `scrollHeight` to `clientHeight`,
ignoring `.sr-only`.

---

## R11 — Responsive type scale (2026-09-16)

Jan reported the typography reading too large on Android, in a device
simulator and on a real phone. R10 had swept 390 and 412 for clipping, tap
targets and characters per line — never for heading size, and never at 360,
which is the common Galaxy/Redmi width and 8% narrower than the iPhone frame
a simulator defaults to.

**What was wrong.** The scale was one fixed set of rem values drawn for the
desktop panel. Measured at 360 with the `px-5` gutter, leaving 320px:

- Page h1s 48px — `/work/` and `/lab/` wrapped to three lines, about eleven
  characters a line for an extrabold display face.
- Section h2s 36px and h3s 27px at *every* width; only 11 of ~180 text call
  sites stepped down at all.
- Ledes 21px → 29–32 characters a line, against a comfortable 45–75.

**What changed.** One thing: `design/tokens.css`. The `--text-*` scale moved
out of `@theme inline` into a plain `@theme`, holding a 1.18 phone ratio off
the same 17px body, and an unlayered `:root` media query steps it to the
original 1.26 scale at 40rem. The bottom four steps (11/13/15/17) are
unchanged — they were already right on a phone, and `--text-2xs` carries the
mono labels and the tab bar.

**Why the `@theme` split was unavoidable.** `@theme inline` makes Tailwind
emit the literal into the utility — `.text-2xl{font-size:2.25rem}` — so
overriding the variable in a media query would have moved the two raw-CSS
uses (`.boot__name`, `.boot__role`) and silently missed every utility. Plain
`@theme` emits `font-size:var(--text-2xl)`. The colours and fonts must stay
`inline` for the opposite reason: `.dark` and next/font reassign them.

**No call site changed.** The existing `sm:text-4xl` / `lg:text-4xl` steps on
the page h1s compose with the responsive tokens rather than fighting them —
each variant resolves through the same token, so it raises the desktop end
while the token lowers the phone end. Collapsing them, as first planned,
would have cut desktop h1s from 68px to 48px. Verified by diffing the built
CSS before and after: the only changes are `font-size:<literal>` →
`font-size:var(--text-*)` on nine utilities and three variants, plus the new
media block. Every `line-height` declaration is byte-identical, so at ≥640px
the site renders exactly as it did.

**Verified** with a headless sweep (`typesweep.mjs`, scratchpad — rebuild it
by serving `out/`, then reading computed `font-size`, box-height ÷
line-height for line counts, and `documentElement.scrollWidth`) at 360×800,
390×844, 412×915 and 1280×800 on `/`, `/work/`, `/work/mgb-ebudget/`,
`/services/`, `/about/`, `/lab/`, `/contact/`:

- 1280 unchanged — h1 68, h2 36, h3 27, body 21/17/15, the fitted home's
  `.home-fit__title` clamp still winning at 44px.
- 360 — h1 33px in one or two lines, h2 28, h3 20–23, ledes 20px. No page
  gained horizontal scroll.

**Found, not fixed — `/contact/` overflows 10px at 360.** Its single-column
grid takes a 350px min-content track inside a 320px column, so every child
sits 10px past the viewport and the page scrolls sideways. Re-measured with
the old token values forced back on: **370px either way** — pre-existing,
nothing to do with the type scale, and invisible to R10 because 360 was not
in that sweep. The likely culprit is an unbreakable string in the socials
list (the Discord snowflake) with no `min-w-0` on the grid.

**Not measured:** a real Android device. R9 still lists that open. Note when
it happens that Chrome for Android's own text-scaling slider (Settings →
Accessibility) multiplies page text on top of this and often ships above
100%. The site honours it correctly because everything is in rem — never add
`text-size-adjust: none` to defeat it.

---

## R12 — Mobile shell (2026-09-16)

Four things Jan reported from a phone, all in the shell. Measured on the
build at 360 and 390 before touching anything.

**What was wrong**

- **The name truncated to "Jan Luigi Ri…".** It needs 104px; it had 73px at
  360 and 87px at 390. What ate the width was the header's "Get in touch"
  pill — 79–95px, and at 360 it was wrapping onto two lines inside a 56px bar.
- **No portrait below lg.** The mobile bar showed a JLR monogram, and the rail
  that carries the photo is hidden there, so Jan's face never appeared on a
  phone.
- **"Get in touch" three times on the home screen:** header pill, hero button,
  and Contact in the tab bar.
- **136px of dead space under the footer** — the panel's `pb-24` (96px,
  reserved so the floating tab bar never covers the footer) plus the footer's
  own 40px. The bar slides away on scroll-down (R10), so a reader who reaches
  the end sees the whole reserved band empty.

**What changed**

- **The header pill is gone below lg** (Jan's call). The tab bar's Contact is
  permanent and thumb-height; the hero keeps its client/employer pair. That
  freed 87–103px — enough for the full name *and* the photo.
- **The photo at 36px** in the bar, `.avatar-mark` in `design/tokens.css`.
  Deliberately not `.portrait`: a 22px blur, a 14px drop-shadow and a shoulder
  fade are all bigger than the element. What a 36px circle needs is a crop —
  the source is a 512² head-and-shoulders frame, so untouched it reads as a
  distant figure in a t-shirt. `scale(1.3)` from `50% 0`, with a ring and
  fill so the transparent cutout does not float on the bar in either theme.
  Falls back to the monogram when `lib/avatar.ts` returns null, as the rail does.
- **The reserved band is now the bar's actual footprint** — 65px tall plus its
  `bottom-3` offset is 77px, so `pb-[calc(5rem+env(safe-area-inset-bottom))]`.
  The `env()` term is a fix, not a tidy-up: the bar carries the same inset as
  a margin, so on a notched phone it sits ~34px higher and the old flat 96px
  was already short.
- **The footer's bottom padding drops to 24px on phones** (`pb-6 sm:pb-10`).
- **The tab bar stays put within 64px of the document end** (`END` in
  `tab-bar.tsx`). This is the change that actually removes the *perception* of
  emptiness: the band is reserved whether or not the bar is in it, so hiding
  the bar down there bought nothing and cost the whole band. No interaction
  with reduced motion — that branch returns before the scroll listener is
  attached, so `away` is already always false.

**Verified** headless at 360×800, 390×844 and 412×915 on `/`, `/work/`,
`/about/`, `/contact/`, each with and without `html.a11y-text-2`:

- the name span's `scrollWidth` equals its `clientWidth` everywhere — 104/104,
  and 117/117 at the largest a11y text step. Not "wider", actually unclipped.
- the avatar renders at 36px (41px at a11y-text-2 — it is in rem).
- no header pill on any page; `documentElement.scrollWidth` clean at all three
  widths except `/contact/` (below).
- dead space below the footer's last line: **104px, from 136px** — and at the
  document end the tab bar is visible inside it, 11px off the viewport bottom,
  so what the reader sees is a nav, not a void.

**A trap worth writing down.** The first sweep reported `/contact/` clean at
360 and it is not. `waitUntil:"load"` plus a 350ms settle is not enough on
this site: the boot intro overlay (`div.boot`) and the archipelago canvas lay
out after that, and both stretch to the document width. Give any overflow
measurement ≥500ms after `fonts.ready`, or it will report a page clean that
is not.

**Still open — `/contact/` overflows 10px at 360.** Unchanged by this pass and
by R11: a 350px min-content grid track inside a 320px column, most likely the
unbreakable Discord snowflake in the socials list with no `min-w-0`. At
`a11y-text-2` it reaches 19px, and the tab bar itself then overflows its
`inset-x-3` by 6px.

---

## R13 — Sitemap, the 360px overflow, per-page counts, one LCP attempt (2026-09-16)

Jan asked what was left worth doing. The audit's answer is in two halves: what
follows, and **two things worth more than all of it that only Jan can do** —
the three lab notes still at `bodyReviewed: false` (106 words of `<main>` in
production against 3,799 for a case study, on three pages the nav and sitemap
both point at), and the absence of any testimonial.

### `/writing` is no longer in the sitemap

It renders "Phase 6 · MDX" and "Candidates: shipping signed auto-updates…"
verbatim — build-phase language on a page a recruiter could reach from a
search result. It was already kept out of the nav and out of Ctrl+K search for
exactly that reason (`lib/search-index.ts`); `app/sitemap.ts` was the odd one
out. Now 13 URLs, no `/writing/`. Put it back in the commit that adds posts.

### The 360px overflow was one bug, not two

`/contact/` scrolled sideways 10px at 360 (19px at `a11y-text-2`), and the tab
bar appeared to overflow its `inset-x-3` by 6px. **The second was a symptom of
the first**: a `position: fixed` element sizes to the containing block, so when
the document widened to 370 the bar widened with it. One fix cleared both.

The cause, finally: `div.grid gap-12 lg:grid-cols-[…]` on
`app/contact/page.tsx` had **no base `grid-cols`**, so below lg it got an
implicit `auto` track. An auto track may not shrink below its items'
min-content contribution and is free to exceed its container — the computed
`grid-template-columns` read **350px inside a 320px box**. The `lg:` rule
already guards against this with `minmax(0,…)`; the mobile case never got the
same treatment. Adding `grid-cols-[minmax(0,1fr)]` at the base width fixed it.

**Three wrong hypotheses were paid for before that — do not repeat them:**

- *The boot intro overlay.* Measured 370px with the intro both running and
  skipped.
- *The socials list's min-content.* The `<a>` measures 202px; `min-w-0 flex-1`
  and `truncate` were already in place. The four cards rendering at 350px were
  a **consequence** of the track, not its cause.
- *`div.grid`'s own min-content* (266px). Setting `width: min-content` on a
  **grid item** measures the item inside the already-sized track and tells you
  nothing about the track's sizing. Read the container's computed
  `grid-template-columns` instead — that is the number that gives it away.

Also: filter `position: fixed` out of any overflow walk first. The archipelago
layer is always the widest element on an overflowing page and always a
symptom; a walk that follows the widest child lands there and learns nothing.

### Per-page counts (workers/visits migration 0003)

The rail's single total says people arrive, not what they read. New
`POST /view?p=…`, counted once per visitor per Manila day per path, keyed by
the **same** `visitor` hash as `/hit` so the privacy design is unchanged.

`/hit` could not carry this: it fires once per browser session, so it only
ever knows the landing page. The beacon therefore lives in
`components/shell/visit-count.tsx` on a `usePathname()` effect — already a
client component mounted once in the shell, already importing nothing new
(`usePathname` is in `rail.tsx` and `tab-bar.tsx` too).

- **No read endpoint and no UI.** The rail still shows the one total. Jan
  reads the breakdown from a terminal; the command is in the migration.
- The path arrives from the browser, so it is untrusted: `okPath` matches it
  by **shape** (`ROUTES` plus `^/(work|lab)/<slug>/$`, slug capped at 60
  chars), so adding a case study needs no Worker deploy and nobody can grow
  the table a row at a time. 22 path cases tested, including `..`, uppercase,
  an 80-char slug, a basePath-prefixed path and `//evil.com/`.
- `page_views` carries **no** start offset. Migration 0002's +3,000 is the
  rail total only, so the two will not reconcile and are not meant to.

**Verified against a local D1:** the trigger counts a new (day, visitor, path)
once and ignores the repeat — two visitors and three inserts on one path gave
`count: 2`; the rail total stayed at exactly 3000 (the offset, no real
visits); the nightly cleanup dropped an old key (4 → 3) while `page_views`
kept all four counts.

**Jan runs these** (his own Cloudflare account):

```bash
cd workers/visits
npx wrangler d1 migrations apply portfolio-visits --remote
npm run deploy
```

Nothing breaks if they are not run yet: `/view` 404s and the browser ignores
it. Note `workers/visits/node_modules` had never been installed on the office
PC — `npm install` there is part of the setup in section 0.

### LCP — a measured dead end

**Tried:** React 19 preloads the images it server-renders, which put six
`<link rel="preload" as="image">` in the home page's head — `/avatar.webp`
plus **five tool marks, 27 KB, 20 of it one unoptimised `nous-research.svg`** —
competing with the fonts. `loading="lazy"` on the marks stops React preloading
them; preloads went 6 → 1.

**Reverted.** It bought nothing measurable: LCP median 1400 → 1420 ms over
five runs each, ranges overlapping (1368–1512 vs 1300–1464). And the marquee
scrolls horizontally, so its off-screen marks would have popped in
mid-animation.

**The finding that matters, and that reframes the budget:** on this page
**LCP is exactly equal to FCP, run for run** — the lede paints with the first
paint. Confirms R9b from a different direction. So LCP here is gated by HTML,
CSS and CPU, not by anything that loads after the first paint, and no amount
of resource reordering will move it. The remaining levers are the hydration
floor (structural) and the ~108 KB of preloaded woff2 — and the fonts are
already preloaded, so that lever is spent too.

Harness (rebuild it from here): serve `out/` with gzip, Playwright at
412×915, CDP `Network.emulateNetworkConditions` 1.6 Mbps / 150 ms and
`Emulation.setCPUThrottlingRate` 4, a `PerformanceObserver` on
`largest-contentful-paint` with `buffered: true` installed via
`addInitScript`, five runs, compare medians and ranges. Note
`performance.getEntriesByType("largest-contentful-paint")` returns nothing
after the fact — it must be an observer.

**Still owed:** the real mid-range Android on mobile data. Every number above
is an emulator, and the repo's own conclusion stands — decide whether the site
or the Lighthouse ≥ 95 budget changes, with Jan.

---

## R14 — Asset weight, and two tours that open on nothing (2026-09-16)

Nothing had ever audited `public/`. It held the heaviest thing on the site by
4.7×, and looking at why turned up a worse defect that had nothing to do with
size.

### The LMIS tour was never run through the pipeline

| tour | duration | fps | bitrate | size |
|---|---|---|---|---|
| mgb-ebudget | 29 s | 15 | 369 kb/s | 1.3 MB |
| mgb-region-1-etracker | 45 s | 15 | 281 kb/s | 1.6 MB |
| sentro | 45 s | 15 | 134 kb/s | 0.8 MB |
| **santol-lmis (before)** | **113 s** | **25** | **526 kb/s** | **7.4 MB** |

`scripts/media/reencode.mjs` already carried `"santol-lmis": { start: 0,
duration: 45 }` and forces 15 fps. Santol's file was the only one still at
25 fps and the only one over its planned length — the script had simply never
been run for that slug. `components/work/loop-video.tsx` is careful
(`preload="none"`, `src` withheld under reduced motion / Save-Data / 2g,
playback gated on 25% visibility), so it downloaded only when a reader
scrolled the banner in — but then it was 7.4 MB, to a buyer CLAUDE.md places
"outside Metro Manila on mobile data".

**Now 45 s, 15 fps, 2.9 MB.** `public/` went 13.9 → 9.7 MB.

**Why 2.9 MB and not ~1.6 MB like etracker at the same length.** Bitrate here
is content-driven, not configuration: the script caps at `-b:v 600k` and
santol's dense scrolling text sits near the cap (543 kb/s) where sentro's
simpler frames fall to 134. The whole saving came from the duration cut —
526 → 543 kb/s means dropping 25→15 fps changed nothing, because the encoder
targets the cap either way. **Do not lower the bitrate to chase the other
files.** The script's header records why: the first pass "chased file size and
starved the bitrate… On the page that reads as judder — Jan, 2026-09-13."
2.9 MB is what this content costs at the agreed quality.

### Every recording opens on a blank page load

Found while checking the cut. A banner **loops**, so a blank head is not an
intro — it is a white flash every lap.

- **santol-lmis**: blank until ~2.5–3.0 s. `start` is now `3.5`; the new cut
  has **0 blank frames of 90 samples**.
- **sentro: 48% of its 45-second loop is blank** — 21.5 s, with content
  starting at 9.0 s and more blank later. This is shipping now. It is by far
  the worse defect of the two and has nothing to do with file size; its low
  134 kb/s is explained by half the clip being a flat white frame.
- mgb-ebudget and etracker open on content (etracker already had `start: 10`).

**sentro is not fixable from what is on disk.** No `00-tour.full.webm` exists
for it — `.gitignore:16` excludes them and only santol's survived, on this PC,
as a by-product of this run. Re-cutting sentro would mean encoding from an
already-compressed 45 s cut, which the script explicitly exists to avoid, and
would leave 36 s. The right fix is to re-record it with
`scripts/capture/sentro.mjs` and then run the re-encode; its PLAN entry is set
to `start: 9` and commented so nobody applies it to the compressed file by
mistake.

**Method, worth reusing:** sample frames with `ffmpeg -vf fps=2` and read the
PNG byte sizes — a flat frame compresses to a few hundred bytes against tens
of thousands for a real one. It finds blank segments in seconds without
watching anything.

### The Nous Research mark — half, not a fifth

19.8 KB, 5.8× the next-largest tool mark, for a 24×24 viewBox that never
renders above 18 px (`ToolIcon` is called at 12–18 px). SVGO, measured against
the original by SSIM at every size it is used:

| | size | SSIM @18 px | @36 px | @144 px |
|---|---|---|---|---|
| precision 1 | 3.5 KB (−82%) | 0.929 | 0.899 | 0.873 |
| **precision 2** | **9.9 KB (−50%)** | **0.997** | 0.996 | 0.995 |

The plan's ~4 KB target was reachable but not honestly: at precision 1 the eye
and hair go visibly polygonal when enlarged, and 0.93 is a real deviation, not
a rounding one. Six KB is not worth rendering someone else's logo more coarsely
than every other mark on the page. Precision 2 shipped. Note SVGO strips
`<title>` by default — it was put back by hand; keep it on any future pass.

### Verified

Decodes clean with no errors; 677 frames = 45 s × 15 fps exactly; 0 of 90
half-second samples blank; the poster (`00-tour.jpg`) is a real content frame,
unchanged; `00-tour.full.webm` (7.4 MB) sits beside the cut and `git status`
does not list it — **it is the only copy of the full LMIS recording anywhere**,
so do not clean it up. Typecheck and build pass; the export carries the 2.9 MB
tour and the 9.7 KB mark.

---

## R15 — /about was clipping 152px of itself (2026-09-16)

Jan sent phone screenshots of `/about` with text cut mid-word the whole way
down: the headline, the paragraph, every role row, the credential chips, the
figure's status panel.

### The detection hole — the part worth keeping

**R10, R11, R12 and R13 all reported these pages clean. They were wrong, and
the reason is the check.** Every sweep asked
`documentElement.scrollWidth > clientWidth`. That question cannot see content
clipped by an ancestor's `overflow: hidden`: the page does not scroll, so the
page looks fine. R11 explicitly saw `div.p-6` and `div.max-w-2xl` past the
right edge on `/about/`, found no page scroll, and wrote them off as "inside a
horizontally-scrollable or clipped container — not a bug". That call is what
let this ship through four hardening passes.

**The check to use instead**, which found it in one run: for every element with
`display: grid`, sum the computed `grid-template-columns` widths plus column
gaps and compare against that element's own content box. A track wider than
its box is the defect, scrolling or not. Keep the scrollWidth assertion too —
it is necessary, just not sufficient.

Across 8 widths × 10 pages it returned exactly two hits, so the fix below is
the whole problem rather than a sample.

### The cause — the same trap as R13's `/contact/`

`components/about/about-card.tsx` had `grid` with only an
`xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]`. Below 1280 that leaves an
implicit `auto` track, which may not shrink below its contents' min-content
contribution and may exceed its container. It resolved to **452px inside a
300px box**, and the same element's `overflow-hidden` cut the other 152px off
in silence. Not phone-only: 152px at 360, 100 at 412, 95 at 640, 63 at 1024,
clean only at 1280 where the `xl:` rule takes over.

Bisected to the cause rather than guessed — hiding the story column dropped the
track to 300px, then hiding the second `<li>` dropped it to 302, then hiding
that row's text span dropped it to 302 again. The driver is the proof line
`eBudget · Mines and Geosciences Bureau — Regional Office I`: **`truncate` sets
`white-space: nowrap`, so the span contributes its full 404px to intrinsic
sizing even though it renders at 228px with an ellipsis.** `min-w-0` on the
parent lets the flex *item* shrink — it does — but does not reduce what the
subtree contributes to sizing the track. That is the non-obvious half.

Fixed with a base `grid-cols-[minmax(0,1fr)]`, exactly as `/contact/` was.
`components/contact/brief-form.tsx` had the same trap on the `<form>` element
itself (+30px at 360) and got the same one-line fix.

### The second-order problem the fix exposed

Removing the clip left the role rows correct but useless: the `shrink-0` tool
cluster is ~120px, so in a 252px row the proof line got **77px — "LMIS · M…"**.
The row already carried `flex-wrap … sm:flex-nowrap` for exactly this, and it
could never work: `flex-1` has a 0 basis, so the text shrinks instead of
wrapping.

`basis-full` on the text is what actually pushes it to its own full-width line,
with `order-last` + `ml-auto` keeping the row number beside the icons instead
of stranded on a line of its own. Proof width 77 → 252px at 360, 304 at 412;
fully readable rows 0/4 → 2/4 at 360 and 3/4 at 412. Visual order only — DOM
and reading order unchanged, and the row is a single link so there is no focus
order to desynchronise. From `sm` up nothing changed (81px rows, as before).

### Deliberately not done

A grep finds 14 grids with only breakpoint-prefixed `grid-cols`
(`app/lab/page.tsx:97,174`, `components/home/bento.tsx:111,298`,
`components/work/work-gallery.tsx:286,512`, others). The other twelve measure
clean at every width tested — nothing in them refuses to shrink. Changing them
is churn against layouts R10 tuned by measurement. The rule is in CLAUDE.md;
fix the rest on evidence, not on grep.

### Verified

80 page/width checks (8 widths × 10 pages): **grid tracks exceeding their box
0, was 2; horizontal scroll 0.** `/about/` at 360 and 412 reads end to end with
nothing cut. `/about/` at 1280 unchanged. Typecheck and build pass.

---

## R16 — One social row per viewport (2026-09-16)

Jan's phone screenshot of `/about` showed the four profile icons twice, ~280px
apart. Counting every social row on every page at both widths showed it was
neither a mobile problem nor an `/about` problem:

| page | 390 before | 1280 before | after (both) |
|---|---|---|---|
| `/` | 1 footer | 1 rail | 1 |
| `/work/`, `/services/`, `/lab/` | 1 footer | **2** rail + footer | 1 |
| `/about/` | **2**, 283px apart | **3**, and the page block sat **142px** from the footer | 1 |
| `/contact/` | 2, 688px apart | 3 | 2 — the card list plus one shell copy |

The pair Jan saw on a phone is **tighter on a laptop**, and the rail/footer
repeat ran site-wide.

`components/shell/panel-footer.tsx` already argued against itself: its header
says it is "deliberately thin" because "on desktop the rail already carries
the name, the role line, the availability state, **the socials** and the
copyright, so repeating all of it here would be the third copy on screen" —
then rendered `SocialLinks` at every width. R12 removed the footer's nav list
on precisely that reasoning; the socials were the leftover.

**Changed:** dropped `<SocialLinks />` from the `/about` `#hire` block, and
gave the footer's copy `lg:hidden`.

The footer's socials must stay below lg — with the rail hidden they are the
only link to any profile on `/`, `/work`, `/services` and `/lab`. Removing
them outright would have left three of five pages on a phone with nothing but
an email address. That was the regression worth watching for, and it is in the
verification below.

The `#hire` block keeps what it is for: Download CV, "Email me about a role",
the availability pill. Nothing else moved — the 64px gap under the pill is the
section's own `py-16`, not a hole where the icons were.

**Verified** at 390, 1024 and 1280 on `/`, `/work/`, `/about/`, `/contact/`,
`/services/`, `/lab/`: exactly one row everywhere except `/contact/`, whose
card list sits 435–688px from the shell copy. Footer socials still present at
390 on `/work/`. No empty containers left in the hire block; its two links
intact. Typecheck and build pass.

---

## Budgets to re-check after each phase

From CLAUDE.md: LCP < 2.0 s on 4G mid-range Android · CLS < 0.05 · INP < 200 ms
· main JS < 200 KB gzip · Lighthouse ≥ 95 performance, 100 accessibility.
Phase 2 (Turnstile script, Contact page only) and Phase 4 (palette) are the
two that touch JS weight.

---

## R9 — Hardening baseline (2026-09-14)

The first time the budgets were measured. Before 2026-09-14 no numbers
existed; "the budgets are met" had never been checked.

### Budgets: where they stand

| Budget | Before | After | Status |
|---|---|---|---|
| First-load JS (gzip, modern browsers*) | 218–239 KB | **153–174 KB** | met |
| three.js chunk (lazy) | 131 KB | 131 KB | met |
| Accessibility (Lighthouse) | 94–97 | **100** on all 7 pages | met |
| axe violations (every page × light/dark × desktop/phone × motion) | 3 rules, ~100 nodes | **0** | met |
| CLS | 0–0.11 (`/about/`) | 0–0.046 | met |
| LCP, real 4G + 4× CPU throttling | 2.2–2.6 s | 2.2–2.6 s | **open** (budget 2.0) |
| Performance, real throttling | 68–77 | 72–79 | **open** (budget 95) |
| TBT (the lab stand-in for INP) | 850–1605 ms | 860–1100 ms | **open** |

\* Excludes the 38.6 KB polyfill chunk, loaded `noModule` — modern browsers
never download it.

Measured on local production builds of the same commit with and without
the changes, served like Pages (gzip, `/portfolio` base path), so the only
difference is the code. Lighthouse 13 mobile preset; two runs per page with
real throttling, three simulated. The live site measured the same shape
before the changes (Performance 63–93, LCP 2.8–4.1 s simulated).

**Lighthouse's simulated LCP (3.1–4.5 s) is not the number to chase here.**
Unthrottled, the LCP element paints with the first paint (~270 ms); the
simulation counts the three web fonts and all early JS as dependencies of
the text. Real throttling (`throttlingMethod: "devtools"`) gives 2.2–2.6 s,
which is network time for HTML, CSS and fonts on slow 4G.

Dead end, don't repeat: the boot intro is **not** the LCP cause. The same
build served with the intro disabled measured the same LCP (3.8–4.6 s
simulated). Removing it would cost Jan's design and gain nothing.

### What was fixed

- **`--text-3` #6d827a → #586d66** (light; Jan approved). Was 3.76:1 on the
  ground; now ≥ 4.58:1 on every light background. Dark `--text-3` passes
  (4.6–5.4:1) except on dark `--accent-soft` (4.05:1) — no such pairing
  exists today; do not create one.
- **Focus ring 45% → 80% accent** (Jan approved): 2.0:1 → 3.8–4.1:1.
- `/services/`: "Scope. Build. Keep running." is an `h2` (the page jumped
  h1 → h3); the method cards' faint numbers are CSS `::after` content, not
  DOM text (axe checks aria-hidden text too); the update-flow diagram, which
  scrolls sideways on phones, is focusable with a label.
- **Motion loads after hydration** (`components/motion/page-motion-lazy.tsx`):
  GSAP, its plugins and Lenis left first-load JS — the whole JS budget fix.
- **Intro timers start at navigation**, in the boot script (`INTRO` in
  `lib/motion.ts`), and the hero's delay counts down from there. On a slow
  phone the page was hidden until hydration + 1.65 s.
- **A failed lazy chunk no longer blanks the page.** Blocking the three.js
  chunk replaced the whole page with Next's error screen (no title, no
  `lang`, no `<main>`) — any dropped connection on mobile data could do it.
  `components/site/optional.tsx` catches it; verified by blocking the
  three.js and motion chunks on three pages.

### Checked and passing

- Keyboard, desktop and phone, every page: skip link first and lands in
  `#main`; every stop has a visible ring; no hidden or zero-size stops except
  the mode switch's native radios (the ring is on the label, 2 px accent) and
  the Turnstile widget (third-party). Gallery viewer: opens on Enter, focus
  inside, Tab stays inside, Esc closes, focus returns to the card.
- Reduced motion: after scrolling every page to the bottom, nothing is left
  invisible; the process spine is fully drawn.
- 554 rendered text nodes axe could not decide (glass, gradients,
  pseudo-elements) checked by sampling pixels: all pass AA.

### R9b — the speed pass (2026-09-14): what the profile showed

Live after R9, real throttling, 3 runs: `/` Performance 70 · LCP 2.48 s ·
TBT 1258 ms; `/work/` 75 · 2.34 s · 740 ms; `/contact/` 73 · 2.28 s · 969 ms.
Accessibility 100, axe 0 violations, first-load JS 153–174 KB — R9 holds live.

Profiled with a `next build --profile` build and CDP traces at 4× CPU,
then A/B'd by injecting CSS and blocking chunks (interleaved runs):

- **The floor is Next/React startup, not this site's code.** With `<main>`
  hidden entirely, blocking time stays ~1000 ms on `/`; with the three.js
  and motion chunks both blocked it is ~870 ms on `/` and ~620 ms on
  `/work/`. That is hydration of the App Router shell and parsing its inline
  RSC payload. Cutting it means restructuring the shell — not done.
- **The lazy enhancements are ~200 ms of it together:** three.js ~110 ms,
  motion ~100 ms (mostly GSAP evaluating its own code; the setup touches only
  0–2 split headings and 1–4 reveals per page).
- **No single CSS property is to blame.** `text-wrap`, filters/masks,
  shadows, web fonts and containment each moved nothing beyond noise
  (±100 ms on this machine). The Lighthouse benchmark index here is ~2000,
  so the 4× slowdown is calibrated, not exaggerated.

**Done:** ScrollTrigger removed from `page-motion.tsx` — nothing created a
trigger, so its update/refresh calls were dead. Lazy motion JS 85.6 → 69.1 KB
gzip; motion verified unchanged (splits, Lenis, every reveal completes, the
spine draws 0 → 100 %, the flow dots run).

**Dead ends — don't repeat:**

- *The work gallery split* (planned): `/work/` has the lowest floor of all,
  so server-rendering its cards would gain little.
- *Sending the marquee list once* and cloning it in the browser: HTML
  207 → 162 KB and RSC payload 108 → 84 KB, but blocking time did not move
  (the clone restores the same nodes). Built, measured, reverted.
- *Chunking the motion setup*: nothing to chunk — see the counts above.

### Still open — performance

1. **Hydration floor** (~620–870 ms at 4× CPU): the only large lever left,
   and a structural one (fewer client components in the shell).
2. **Fonts.** Three woff2 files, ~106 KB, sit between the HTML and the LCP
   text on slow 4G.
3. **The budget itself.** Lighthouse mobile ≥ 95 is unlikely with a WebGL
   background, GSAP and the App Router shell; decide after step 4 whether the
   site or the budget changes.
4. **Real device.** None of this has been measured on a real mid-range
   Android on mobile data — the only number that counts. Steps: enable
   Developer options → USB debugging on the phone, connect it, open
   `chrome://inspect` on the PC, open the live site on the phone over mobile
   data (Wi-Fi off), then DevTools → Performance → Live metrics for `/`,
   `/work/mgb-ebudget/`, `/contact/`.

### Re-running it

The scripts lived in a session scratchpad; rebuild them from this
description. In a folder outside the repo: `npm i lighthouse
@axe-core/playwright playwright` (never in the project).

- **Lighthouse:** node API, mobile preset, `throttlingMethod: "devtools"`
  for real throttling; median of ≥ 2 runs; Chrome's temp-profile cleanup can
  throw EPERM on Windows — catch it.
- **JS weight:** gzip every `<script src>` in each page's HTML, minus the
  `noModule` one.
- **axe:** `@axe-core/playwright` with tags wcag2a/aa, wcag21a/aa, wcag22aa,
  best-practice; seed `localStorage.theme` and `sessionStorage.booted`.
- **Build to compare:** `next dev` and `next build` can run at once
  (`.next/dev` is separate). Build with `NEXT_PUBLIC_BASE_PATH=/portfolio`
  and serve `out/` under `/portfolio` with gzip.
