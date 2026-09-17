import { SITE } from "./site";

/**
 * The Content-Security-Policy. Served as a header through `_headers` on
 * Cloudflare (R27), and also as a <meta> in app/layout.tsx (R24), which still
 * protects a copy of the build served without headers.
 *
 * What it buys: a script that should not be here — a compromised dependency,
 * say — cannot send data anywhere but the two Workers and Turnstile
 * (`connect-src`), load code or frames from elsewhere, embed plugins, or
 * re-point relative URLs with a <base> tag.
 *
 * What it does not buy, so nobody believes otherwise:
 *   · `script-src` allows 'unsafe-inline'. The static export writes a
 *     different inline `self.__next_f` payload into every page, plus
 *     THEME_BOOT; hashing them all per build is not maintainable. So this
 *     policy does not stop injected inline script. The site renders no
 *     visitor-supplied content, which is what keeps that surface small.
 *   · A meta CSP ignores `frame-ancestors`. Clickjacking protection is the
 *     header copy's `frame-ancestors 'none'` plus X-Frame-Options.
 *   · Next hoists its preloads, stylesheet and async chunk <script> tags above
 *     anything the layout puts in <head>, so those few same-origin loads
 *     happen before the policy exists. Everything after — including every
 *     fetch, dynamic import and frame those chunks start — is checked.
 *
 * Production builds only: `next dev` needs eval for React Refresh.
 *
 * **Adding anything the browser loads from another origin** — a script, a
 * fetch, an iframe, a font, an image — means adding that origin here. It
 * will work in `npm run dev` and fail only on the built site.
 */

const TURNSTILE = "https://challenges.cloudflare.com";

const originOf = (url: string | null) => (url ? new URL(url).origin : null);

/**
 * `header: true` is the HTTP-header copy served through `_headers` on
 * Cloudflare (app/%5Fheaders/route.ts, R27). It adds `frame-ancestors`, which
 * only works as a header — in a <meta> browsers ignore it and log a warning.
 * Both copies come from here, so they cannot drift apart.
 */
export function contentSecurityPolicy({ header = false }: { header?: boolean } = {}): string {
  const workers = [SITE.visitsApi, SITE.contactApi].map(originOf).filter(Boolean);
  const policy: Record<string, (string | null)[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", TURNSTILE],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "media-src": ["'self'"],
    "connect-src": ["'self'", ...workers, TURNSTILE],
    "frame-src": [TURNSTILE],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    // The brief form's no-JavaScript path is `action="mailto:…"`.
    "form-action": ["'self'", "mailto:"],
    ...(header ? { "frame-ancestors": ["'none'"] } : {}),
  };
  return Object.entries(policy)
    .map(([directive, sources]) => `${directive} ${sources.filter(Boolean).join(" ")}`)
    .join("; ");
}
