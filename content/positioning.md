# Positioning — v2

Changed 2026-09-10 on Jan's instruction. The v1 positioning — "records systems
for Philippine LGUs and national agencies" — sold him as a government niche.
Those projects are where he *started*, not what he wants to be hired for.

---

## The line

> **I design and build software products — web apps, desktop apps, and
> multi-site platforms.**
> From the database to the installer, and the updates after.

Source of truth: `SITE.line` / `SITE.sub` in `lib/site.ts`. Hero, metadata and
the About page all read it.

Not in the line on purpose: "works offline". eBudget was built offline-first
but **no longer works offline** since its Aug 30 Postgres/Supabase move (Jan,
2026-09-11), and SENTRO's sync engine is not built yet. Claim offline use for
neither.

### Headline — signed off by Jan, 2026-09-11

> **Software that ships. And keeps running.**

It compresses the two things the projects actually prove: they reached
release (eBudget is at v1.0.12 with signed auto-updates), and they stayed up
after it (every role line says *maintenance*).

---

## Audience

In priority order, per Jan:

1. **Businesses and startups** that need a custom system, app or internal tool.
2. **Employers and recruiters** — served by "Hire me" (→ `/about#hire`), the
   skills grid, the CV link (`public/cv.pdf`), and the job-opportunity switch
   on the contact form.
3. **Any client, including government.** Neutral wording that never excludes
   public-sector work — and never leads with it.

---

## Proof, in order

Lead with what was **engineered**, not who bought it.

| # | Project | The one-line proof |
|---|---|---|
| 1 | eBudget | A Windows desktop app — Tauri + Rust — with one shared cloud database and signed auto-updates (in testing) |
| 2 | LMIS | A public portal, a role-based CMS and a staff intranet, three deployments over one data model |
| 3 | SENTRO | An open-source multi-site platform with server-enforced tenant isolation (in development) |
| 4 | eTracker | A tracking portal with a full audit trail, shipped as a container through CI |

Client names go through `displayClient()`. Jan cleared MGB RO1 (eBudget,
eTracker) and Santol (LMIS) for naming on 2026-09-11, so those three case
studies carry `clientCleared: true`. Any new client starts at `false`.

---

## After launch

> **I stay on after launch.** Fixes, updates and new features come from the
> person who built it.

Withdrawn 2026-09-11: the "clients own the accounts" stance, and the "working
session before a price" step. **Ownership and payment terms are not stated
on the site.** The home Updates card, the About "After launch" note and step
4 of the process carry the line above instead. Sector labels are neutral;
the Built for strip says "Client".

---

## Voice

- First person singular. Solo developer; "we" gets caught on the first call.
- Lead with the thing that was built — the installer, the CMS, the audit trail —
  then who it was for.
- Explain a domain term once, briefly, then move on. The reader is as likely to
  be a recruiter as an accountant.
- No superlatives about yourself. Let versions, releases and handover do it.
- Avoid "solutions", "leverage", "digital transformation", "passionate".

---

## Name and domain

Personal name, not a studio: `Jan Luigi Rivera`, handle `@ancientsky14`.
Contact address `janluigirivera@gmail.com`, confirmed 2026-09-11.
The site deploys to `https://portfolio.ancientsky14.workers.dev/` (Cloudflare,
since 2026-09-17; the old GitHub Pages address redirects) until a domain is
picked (`janluigi.dev`, `jlrivera.dev` were the candidates).

---

## Open

1. `public/cv.pdf`, `public/avatar.jpg`.
2. Any testimonial — if none, keep the section cut.