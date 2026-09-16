import Link from "next/link";
import { SITE } from "@/lib/site";
import { SearchButton } from "./search-button";
import { ThemeToggle } from "./theme-toggle";
import { VerifiedBadge } from "./verified-badge";

/**
 * The top bar below lg.
 *
 * Navigation moved to the bottom tab bar (components/shell/tab-bar.tsx),
 * after the reference, so this bar no longer has a menu button or a drawer.
 * What stays is what must be visible without scrolling: whose site this is,
 * search and the theme toggle.
 *
 * It carried a "Get in touch" pill until 2026-09-16. It was the third copy of
 * that one link on the home screen — the hero has it, and the tab bar has
 * Contact permanently, within reach of a thumb — and it cost 79–95px of a
 * 360px bar, which is what truncated the name to "Jan Luigi Ri…" and wrapped
 * the pill itself onto two lines. Jan's call to drop it. Don't add it back:
 * the tab bar is the mobile CTA.
 *
 * The portrait is the rail's photo at 36px (`.avatar-mark`, design/tokens.css).
 * Below lg the rail is hidden, so without this Jan's face never appears on a
 * phone. When public/avatar.webp is absent, lib/avatar.ts returns null and
 * this falls back to the monogram, as the rail does.
 *
 * A Server Component; the search button and theme toggle are its only client
 * parts.
 */

export function MobileBar({ avatarSrc }: { avatarSrc: string | null }) {
  const monogram = SITE.name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/85 backdrop-blur-md lg:hidden">
      <div className="flex h-14 items-center gap-3 px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          {avatarSrc ? (
            // A plain <img>: a static export ships with image optimisation
            // off. alt="" because the link's own text is the name.
            <span aria-hidden="true" className="avatar-mark size-9 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarSrc} alt="" width={512} height={512} />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-mono text-2xs font-medium tracking-widest text-accent-ink"
            >
              {monogram}
            </span>
          )}
          <span className="flex min-w-0 items-center gap-1">
            <span className="truncate font-display text-sm font-semibold tracking-tight">
              {SITE.name}
            </span>
            <VerifiedBadge size={14} />
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <SearchButton variant="bar" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
