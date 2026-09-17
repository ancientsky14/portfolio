import { contentSecurityPolicy } from "@/lib/csp";

/**
 * The `_headers` file for Cloudflare static assets (R27), written by the
 * export to out/_headers. `%5F` is Next's escape for a segment that starts
 * with an underscore — `_headers` would be a private folder.
 *
 * A `force-static` GET like app/og/[card]/route.tsx: it runs once at build
 * time and nothing runs when a visitor asks. Cloudflare reads the file and
 * never serves it.
 *
 * Rules, so nobody undoes them by accident:
 *   · The CSP is the same one as the <meta> in app/layout.tsx, from
 *     lib/csp.ts, plus `frame-ancestors`. Change it there.
 *   · No Cross-Origin-Embedder-Policy: `require-corp` blocks the Turnstile
 *     iframe, and the contact form stops working.
 *   · Share cards (/og/*) are cross-origin on purpose. `!` removes the
 *     site-wide value first; without it Cloudflare joins both with a comma.
 *   · HSTS is sent explicitly. workers.dev is on the browsers' preload list,
 *     but it sends no header of its own (checked live on the first deploy),
 *     and scanners only read the header.
 */

export const dynamic = "force-static";

const PERMISSIONS = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "browsing-topics=()",
].join(", ");

export function GET() {
  const rules: [string, string[]][] = [
    [
      "/*",
      [
        "Strict-Transport-Security: max-age=31536000; includeSubDomains",
        `Content-Security-Policy: ${contentSecurityPolicy({ header: true })}`,
        "X-Frame-Options: DENY",
        "X-Content-Type-Options: nosniff",
        "Referrer-Policy: strict-origin-when-cross-origin",
        `Permissions-Policy: ${PERMISSIONS}`,
        "Cross-Origin-Opener-Policy: same-origin",
        "Cross-Origin-Resource-Policy: same-origin",
      ],
    ],
    ["/og/*", ["! Cross-Origin-Resource-Policy", "Cross-Origin-Resource-Policy: cross-origin"]],
    ["/_next/static/*", ["Cache-Control: public, max-age=31536000, immutable"]],
  ];
  const body = rules
    .map(([path, lines]) => [path, ...lines.map((l) => `  ${l}`)].join("\n"))
    .join("\n");
  return new Response(`${body}\n`, { headers: { "content-type": "text/plain" } });
}
