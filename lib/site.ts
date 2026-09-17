/**
 * Site-level constants that appear in more than one place.
 *
 * Anything still a placeholder is marked NEEDS. None of these should reach
 * production unresolved — the previous portfolio shipped with
 * `jan.rivera@email.com` on it, which is the specific failure this file
 * exists to prevent.
 */

export const SITE = {
  name: "Jan Luigi Rivera",

  /**
   * Absolute site URL, no trailing slash. Drives metadataBase, the sitemap
   * and robots.txt. The deploy workflow sets it to
   * https://portfolio.ancientsky14.workers.dev (Cloudflare, R27).
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  ),

  /** The positioning line. Single source — hero and metadata both read it. */
  // Deliberately not "systems that keep working offline": SENTRO's sync
  // engine is unbuilt, and eBudget no longer works offline since its
  // Postgres move (Jan, 2026-09-11).
  line: "I design and build software products — web apps, desktop apps, and multi-site platforms.",

  sub: "From the database to the installer, and the updates after.",

  /**
   * Confirmed by Jan, 2026-09-11. A domain address (hello@<domain>) can
   * replace it once a domain is picked — see content/positioning.md.
   */
  email: "janluigirivera@gmail.com",

  /**
   * Covers both audiences the site is for — clients and employers.
   * Confirmed by Jan, 2026-09-11.
   */
  availability: "Open to projects and full-time roles",

  /** The one-line role under the name in the rail. */
  role: "Full-stack developer",

  /** Design credit, in the rail and the page footer. Plain text, never a
   *  link — Jan asked on 2026-09-13 that the reference site is not linked
   *  from the page. */
  credit: "© Design inspired by Kenneth Villar",

  /**
   * The live visit counter — the portfolio-visits Cloudflare Worker in
   * workers/visits/, no trailing slash. Drives the count beside the handle in
   * the rail (components/shell/visit-count.tsx). Replaced GoatCounter, whose
   * public total lagged up to four hours (Jan, 2026-09-13).
   *
   * Deployed by Jan to his own Cloudflare account, 2026-09-13. Set to null to
   * switch counting and the count off; the rail then shows just the handle.
   */
  visitsApi: "https://portfolio-visits.ancientsky14.workers.dev" as string | null,

  /**
   * Jan's Cal.com 30-minute event — set 2026-09-14. The event page, not the
   * profile (which also lists a 15-minute one): the button promises 30.
   * Drives the "Book a 30-min call" button in the home hero, on /services
   * and on /contact (components/site/book-call.tsx). Set to null and no
   * button renders anywhere.
   */
  bookingUrl: "https://cal.com/jan-luigi-rivera-4zm6eu/30min" as string | null,

  /**
   * The portfolio-contact Worker's URL (workers/contact/, no trailing slash)
   * and its Turnstile site key — public by design; the secret key lives only
   * in the Worker. With both set, the brief form on /contact sends through
   * the Worker (components/contact/brief-form.tsx). With either null it
   * composes an email in the visitor's own mail app, as it always has.
   *
   * Deployed by Jan to his own Cloudflare account, 2026-09-14. The Turnstile
   * widget allows ancientsky14.github.io only, so on localhost the check
   * fails and the form falls back to the mail app — expected.
   */
  contactApi: "https://portfolio-contact.ancientsky14.workers.dev" as string | null,
  turnstileSiteKey: "0x4AAAAAAEzXmC6xCFa2kh_A" as string | null,
} as const;

/** The brief form sends through the Worker only when both halves are set. */
export const CONTACT_SENDS = Boolean(SITE.contactApi && SITE.turnstileSiteKey);
