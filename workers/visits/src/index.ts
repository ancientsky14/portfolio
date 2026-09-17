/**
 * portfolio-visits — the live visit count beside the handle in the rail
 * (components/shell/visit-count.tsx). Replaced GoatCounter, whose public
 * total lagged up to four hours (Jan, 2026-09-13).
 *
 *   POST /hit     count this visitor (once per Manila day), return { count }
 *   GET  /count   return { count }
 *   POST /view?p= count one page read (once per visitor per day per path)
 *
 * The total includes a fixed +3,000 start offset (migration 0002, Jan,
 * 2026-09-15). Real visits = count - 3000.
 *
 * Privacy: no IP address is stored. A visitor is a SHA-256 of a secret salt,
 * the day, the IP and the user agent; keys older than two days are deleted
 * nightly. No cookies are set.
 *
 * Abuse: only the live site's Origin may add a visit, known bots are not
 * counted, and the same visitor counts once per day. A determined script can
 * still fake an Origin — the per-day key caps that at one visit per IP and
 * user agent per day. Rotating the user agent used to get past that; now an
 * IP adds at most IP_DAY_CAP visitors a day (migration 0004, R25), and
 * HIT_LIMITER (R24) caps request rate at thirty a minute. Both are generous
 * on purpose: a whole office behind one address is the real audience, and
 * colleagues on the same browser build already count as one visitor.
 *
 * /view answers "which pages get read" (migration 0003). It is never exposed:
 * there is no read endpoint and no UI, and the rail still shows the one
 * total. Jan reads it with `wrangler d1 execute` — see the migration. The
 * path comes from the browser, so it is untrusted and is matched against the
 * shapes in `okPath` before it is stored; anything else is dropped, which is
 * what stops the table being filled with junk keys.
 */

export interface Env {
  VISITS_DB: D1Database;
  /** `npx wrangler secret put VISIT_SALT` — a long random string. */
  VISIT_SALT: string;
  READ_ORIGINS: string;
  HIT_ORIGINS: string;
  /** Workers Rate Limiting binding (wrangler.jsonc) — writes per minute. */
  HIT_LIMITER: RateLimit;
}

const BOT =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|curl|wget|python|httpclient|monitor|scan/i;

const list = (csv: string) =>
  csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * The site's routes, by shape rather than by name — adding a case study or a
 * lab note must not need a Worker deploy. Everything else is dropped: the
 * path arrives from the browser, and an unbounded key would let anyone grow
 * the table a row at a time. Paths carry a trailing slash (`trailingSlash:
 * true` in next.config.ts) and no basePath — `usePathname()` strips it.
 */
const ROUTES = new Set([
  "/",
  "/work/",
  "/services/",
  "/about/",
  "/contact/",
  "/lab/",
  "/writing/",
]);
const ENTRY = /^\/(work|lab)\/[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?\/$/;
const okPath = (p: string) => ROUTES.has(p) || ENTRY.test(p);

/** YYYY-MM-DD in Asia/Manila — "one visit per day" means the visitor's day. */
function manilaDay(at = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status: number, origin: string | null): Response {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers.vary = "Origin";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

/** Distinct visitors one IP may add per Manila day (and per path, for /view). */
const IP_DAY_CAP = 20;

/**
 * The per-day visitor key — the same one /hit and /view both count by, so a
 * page read and a visit agree on who a visitor is — and the per-day IP key
 * the cap counts by. Returns null when the request should not be counted at
 * all (no user agent, or a known bot).
 */
async function visitorKeys(
  request: Request,
  env: Env,
  day: string,
): Promise<{ visitor: string; ip: string } | null> {
  const ua = request.headers.get("User-Agent") ?? "";
  if (!ua || BOT.test(ua)) return null;
  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  const [visitor, ipKey] = await Promise.all([
    sha256(`${env.VISIT_SALT}:${day}:${ip}:${ua}`),
    sha256(`${env.VISIT_SALT}:${day}:ip:${ip}`),
  ]);
  return { visitor, ip: ipKey };
}

/**
 * False when this IP has written too often in the past minute. Keyed by a
 * salted hash, never the raw address. The counter is per Cloudflare location
 * and eventually consistent: a flood shield, not an exact count.
 */
async function withinLimit(request: Request, env: Env): Promise<boolean> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  const key = await sha256(`${env.VISIT_SALT}:limit:${ip}`);
  return (await env.HIT_LIMITER.limit({ key })).success;
}

async function total(env: Env): Promise<number> {
  const row = await env.VISITS_DB.prepare("SELECT count FROM totals WHERE id = 1").first<{
    count: number;
  }>();
  return row?.count ?? 0;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const readOrigin = origin && list(env.READ_ORIGINS).includes(origin) ? origin : null;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: readOrigin
          ? {
              "access-control-allow-origin": readOrigin,
              "access-control-allow-methods": "GET, POST",
              "access-control-max-age": "86400",
              vary: "Origin",
            }
          : {},
      });
    }

    if (url.pathname === "/count" && request.method === "GET") {
      return json({ count: await total(env) }, 200, readOrigin);
    }

    if (url.pathname === "/hit" && request.method === "POST") {
      if (!origin || !list(env.HIT_ORIGINS).includes(origin)) {
        return json({ error: "origin not allowed" }, 403, readOrigin);
      }
      if (!env.VISIT_SALT) {
        return json({ error: "not configured" }, 500, origin);
      }
      // The rail falls back to GET /count on any non-2xx.
      if (!(await withinLimit(request, env))) {
        return json({ error: "too many requests" }, 429, origin);
      }

      const day = manilaDay();
      const keys = await visitorKeys(request, env, day);
      if (!keys) {
        return json({ count: await total(env), counted: false }, 200, origin);
      }

      // One transaction: the insert (a repeat, or an IP past its daily cap,
      // inserts nothing, so the trigger does not fire) and the read of the
      // total that the trigger updated. The cap check is inside the INSERT,
      // so two requests at once cannot both slip under it.
      const [, current] = await env.VISITS_DB.batch([
        env.VISITS_DB.prepare(
          `INSERT OR IGNORE INTO visits (day, visitor, ip)
           SELECT ?1, ?2, ?3
           WHERE (SELECT COUNT(*) FROM visits WHERE day = ?1 AND ip = ?3) < ?4`,
        ).bind(day, keys.visitor, keys.ip, IP_DAY_CAP),
        env.VISITS_DB.prepare("SELECT count FROM totals WHERE id = 1"),
      ]);
      const count = (current?.results?.[0] as { count: number } | undefined)?.count ?? 0;
      return json({ count }, 200, origin);
    }

    // One page read. Returns no number — nothing on the site displays this,
    // so there is nothing for the browser to do with a reply.
    if (url.pathname === "/view" && request.method === "POST") {
      if (!origin || !list(env.HIT_ORIGINS).includes(origin)) {
        return json({ error: "origin not allowed" }, 403, readOrigin);
      }
      if (!env.VISIT_SALT) {
        return json({ error: "not configured" }, 500, origin);
      }
      if (!(await withinLimit(request, env))) {
        return json({ error: "too many requests" }, 429, origin);
      }

      const path = url.searchParams.get("p") ?? "";
      if (!okPath(path)) {
        return json({ counted: false }, 200, origin);
      }

      const day = manilaDay();
      const keys = await visitorKeys(request, env, day);
      if (!keys) {
        return json({ counted: false }, 200, origin);
      }

      // A repeat is ignored, so the trigger does not fire — a reader
      // refreshing or coming back to a page counts once for the day. So is
      // an IP that already has IP_DAY_CAP readers of this path today.
      const hit = await env.VISITS_DB.prepare(
        `INSERT OR IGNORE INTO page_hits (day, visitor, path, ip)
         SELECT ?1, ?2, ?3, ?4
         WHERE (SELECT COUNT(*) FROM page_hits WHERE day = ?1 AND ip = ?4 AND path = ?3) < ?5`,
      )
        .bind(day, keys.visitor, path, keys.ip, IP_DAY_CAP)
        .run();

      return json({ counted: hit.meta.changes > 0 }, 200, origin);
    }

    return json({ error: "not found" }, 404, readOrigin);
  },

  /** Daily: forget visitor keys older than two days. The counts stay. */
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const cutoff = manilaDay(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
    await env.VISITS_DB.batch([
      env.VISITS_DB.prepare("DELETE FROM visits WHERE day < ?1").bind(cutoff),
      env.VISITS_DB.prepare("DELETE FROM page_hits WHERE day < ?1").bind(cutoff),
    ]);
  },
} satisfies ExportedHandler<Env>;
