import type { MetadataRoute } from "next";
import { getWorkSlugs } from "@/lib/content";
import { getLabSlugs } from "@/lib/lab";
import { SITE } from "@/lib/site";

// Required for `output: "export"` — generated once at build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/work",
    "/services",
    "/about",
    "/contact",
    "/lab",
    // No "/writing": it is a placeholder until lib/writing.ts has posts, and
    // it renders the build-phase note verbatim ("Phase 6 · MDX", "Candidates:
    // …"). It is already kept out of the nav and out of Ctrl+K search for
    // that reason (lib/search-index.ts) — submitting it to Google anyway was
    // the odd one out. Add it back in the same commit that adds the posts.
    ...getWorkSlugs().map((s) => `/work/${s}`),
    ...getLabSlugs().map((s) => `/lab/${s}`),
  ];

  // trailingSlash: true in next.config.ts — match it, or every URL in the
  // sitemap is a redirect.
  return routes.map((r) => ({
    url: `${SITE.url}${r}/`,
    changeFrequency: "monthly",
    priority: r === "" ? 1 : r.startsWith("/work") ? 0.8 : 0.6,
  }));
}
