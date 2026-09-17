# Jan Luigi Rivera — Portfolio

**I design and build software products — web apps, desktop apps, and
multi-site platforms.** From the database to the installer, and the updates
after.

**Live site → [portfolio.ancientsky14.workers.dev](https://portfolio.ancientsky14.workers.dev/)**

Open to projects and full-time roles.

---

## What's on the site

| Page | What you'll find |
| --- | --- |
| **Home** | What I build, and for whom |
| **Work** | Four case studies, each with a recorded tour and screenshots |
| **Services** | What an engagement covers: fixed scope, a staging link, training, and updates after launch |
| **Lab** | Experiments and technical notes |
| **About** | Who I am, how I work, and the skills behind it |
| **Contact** | A short project brief that lands in my inbox, or a 30-minute call |

## Selected work

I was the sole developer on eBudget, LMIS and eTracker, covering design, build,
deployment and maintenance. On SENTRO I'm the architect and developer. Clients
are named with their permission.

| Project | Type | Status | Stack |
| --- | --- | --- | --- |
| [**eBudget**](https://portfolio.ancientsky14.workers.dev/work/mgb-ebudget/) — MGB RO1 eBudget & Accounting System | Desktop | In testing | Tauri 2, Rust, React 19, TypeScript, SQLite → PostgreSQL |
| [**LMIS**](https://portfolio.ancientsky14.workers.dev/work/santol-lmis/) — Legislative Management & Information System | Web | In production | Next.js 16, TypeScript, Supabase, PostgreSQL, Cloudflare Workers |
| [**SENTRO**](https://portfolio.ancientsky14.workers.dev/work/sentro/) — open-source e-governance platform | Platform | In development | React 19, TypeScript, Vite, PocketBase, Docker |
| [**eTracker**](https://portfolio.ancientsky14.workers.dev/work/mgb-region-1-etracker/) — MGBR1 Disbursement Tracking System | Web | In use | Next.js 16, TypeScript, Supabase, PostgreSQL, Docker |

- **eBudget** is a Windows desktop app for budget execution and accounting
  (Mines and Geosciences Bureau, Regional Office I). It covers allotments,
  obligation requests, disbursement vouchers, reports, journals and ledgers.
  Several office PCs share one database, and the app updates itself from
  signed releases.
- **LMIS** is built for the Municipality of Santol, La Union. It has three
  parts on one Supabase project: a public portal for ordinances, council
  sessions and transparency records, an admin CMS with role-based access, and
  a staff intranet. It moved from Vercel to Cloudflare Workers while already
  in use.
- **SENTRO** is a fork of the MIT-licensed BarangayOS, a system built for a
  single barangay. I'm re-architecting it into a multi-tier platform. Done so
  far: records, case tracking, finance, role-based access, and cloud
  multi-tenancy with isolation enforced on the server. Next: a sync engine for
  offline barangay nodes.
- **eTracker** is a document-tracking portal for MGB Regional Office I. It has
  a full audit trail, Supabase auth, bot protection and row-level security,
  and ships as a container through GitHub Actions. It replaced routing on
  spreadsheets and paper.

Each case study on the site goes further, with a recorded tour, screenshots
and the full write-up.

## How this site is built

- **Next.js 16, React 19, TypeScript, Tailwind CSS v4.** The site is a fully
  static export hosted on GitHub Pages, so no server runs when you visit.
- **An app-like layout.** On desktop, a fixed profile rail sits beside a
  scrolling content panel. Phones get a bottom tab bar. The site has light and
  dark themes.
- **Motion with GSAP and Lenis.** It includes headings that reveal line by
  line, cards that tilt toward the pointer, and page transitions.
- **A three.js background.** It's a field of islands drawn as a GPU point
  cloud, and it reacts to the pointer and to scrolling. It only loads when the
  device can afford it: it's skipped for reduced motion, Save-Data, slow
  connections and low-memory phones.
- **Two small Cloudflare Workers with D1 databases:**
  - a live visit counter (`workers/visits`)
  - the contact form (`workers/contact`), with Turnstile bot protection, Gmail
    delivery, a rate limit, and automatic deletion of stored messages. If
    sending ever fails, the form opens the visitor's own mail app instead.
- **Share previews and search data.** Each page has a link-preview image and
  structured data for search engines, generated at build time.

## Honest by construction

A portfolio is only useful if you can trust it, so the site enforces a few
rules in code rather than leaving them to memory:

- **No client is named without permission.** Each case study falls back to an
  anonymous description until a `clientCleared` flag is set.
- **No invented project metrics.** A case-study metric without a real value
  is removed, never estimated.
- **No unreviewed claims.** A case-study write-up is published only after I
  have reviewed it (`bodyReviewed`). Until then only its summary card shows.
- **Accessible motion.** Every animation has a finished, readable state for
  visitors who prefer reduced motion.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to out/
```

The Workers in `workers/` are separate projects. Install and deploy each one
from its own folder, never from the repo root.

## Contact

- Email: [janluigirivera@gmail.com](mailto:janluigirivera@gmail.com)
- Book a call: [30 minutes on Cal.com](https://cal.com/jan-luigi-rivera-4zm6eu/30min)
- LinkedIn: [Jan Luigi Rivera](https://www.linkedin.com/in/jan-luigi-rivera-604750320/)

## Credits

- Layout inspired by Kenneth Villar's portfolio.
- Fonts: Bricolage Grotesque, Public Sans and JetBrains Mono, under the SIL
  Open Font License.
- Brand icons: Simple Icons, plus devicon and lobehub marks (MIT).
