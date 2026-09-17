import type { NextConfig } from "next";

/**
 * A static export. Served from Cloudflare static assets
 * (https://portfolio.ancientsky14.workers.dev, root wrangler.jsonc, no base
 * path) since R27; GitHub Pages below until the move is finished. Neither
 * runs a server, so everything here still applies.
 *
 * What that costs, so it is not rediscovered later:
 *   · no Route Handlers, no Server Actions, no `resend` — the contact form
 *     posts to a third-party endpoint or falls back to `mailto:`
 *   · no next/image optimisation (`unoptimized`), so ship sized assets
 *   · no ISR, no middleware, no dynamic `generateMetadata` at request time
 *
 * The repo is `ancientsky14/portfolio`, so Pages serves it from
 * https://ancientsky14.github.io/portfolio/ and every asset needs the
 * `/portfolio` prefix — case-sensitive: it was `/Portfolio` until the repo
 * was renamed (2026-09-14). Set `NEXT_PUBLIC_BASE_PATH=""` if the site ever moves
 * to a custom domain or to an `ancientsky14.github.io` repo, where it is
 * served from the root instead.
 */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,

  // GitHub Pages resolves /work/ to /work/index.html; without this a refresh
  // on any route but the home page 404s.
  trailingSlash: true,

  images: { unoptimized: true },

  // Dev-only badge. Default is bottom-left, where the accessibility button
  // sits on desktop (components/shell/a11y-panel.tsx). Never ships.
  devIndicators: { position: "bottom-right" },

  experimental: {
    optimizePackageImports: ["motion", "lucide-react"],
  },
};

export default nextConfig;
