"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";
import { SOCIALS } from "@/lib/socials";
import { BrandIcon } from "@/components/icons/brand";
import { NAV } from "./nav-links";
import { SearchButton } from "./search-button";
import { ThemeToggle } from "./theme-toggle";
import { VerifiedBadge } from "./verified-badge";
import { VisitCount } from "./visit-count";

/**
 * The rail — persistent identity and navigation, left of the scrolling panel.
 *
 * Laid out after the reference shell: portrait, name and handle, a row of
 * round profile buttons with the theme toggle among them, then the nav as
 * icon rows with the current page lifted onto a white pill.
 *
 * Two things the reference does not do that this keeps, on purpose:
 *   · the rail scrolls as one piece when it is taller than the window, the
 *     way the reference does — no inner scroll box, no visible scrollbar,
 *     every element at full size;
 *   · the bottom carries the copyright with the accessibility button beside
 *     it, as in the reference. "Get in touch" lives in the hero, the Contact
 *     nav item and the mobile bar;
 *   · a generic check badge beside the name (Jan, 2026-09-13) — never a
 *     platform's verified mark, which would claim a verification that does
 *     not exist (components/shell/verified-badge.tsx).
 *   · a live visit count beside the handle (Jan, 2026-09-13). GitHub Pages
 *     runs no server, so it comes from the portfolio-visits Worker
 *     (workers/visits/, components/shell/visit-count.tsx). It replaced the
 *     role on that line (Jan, 2026-09-13).
 *     A real number or none: until it loads, or if it cannot, the line
 *     reads just the handle.
 *
 * `avatarSrc` and `avatarDarkSrc` (the white-hoodie photo the dark theme
 * crossfades to) are resolved at build time by lib/avatar.ts. Hidden below
 * `lg`; components/shell/mobile-bar.tsx covers that.
 */

const ROUND =
  "grid size-11 place-items-center rounded-full border border-line bg-surface text-text shadow-soft transition-colors hover:border-accent hover:text-accent";

export function Rail({
  avatarSrc,
  avatarDarkSrc,
}: {
  avatarSrc: string | null;
  avatarDarkSrc: string | null;
}) {
  const pathname = usePathname();

  return (
    // One of the shell's two scroll areas (app/layout.tsx): it scrolls on
    // its own, independently of the panel, with no visible scrollbar. The
    // clamp()s size it by window HEIGHT, as the reference does, so a short
    // laptop screen gets a slightly smaller rail rather than a cut-off one.
    <aside className="no-scrollbar hidden h-full w-80 shrink-0 overflow-y-auto lg:flex">
      <div
        data-intro="rail"
        // pb clears the fixed accessibility button in the corner: at 1100×600
        // it sat on top of a nav row when the rail scrolled (R10).
        className="flex min-h-full w-full flex-col px-7 pb-20 pt-[clamp(28px,4vh,52px)]"
      >
        {/* identity */}
        <div className="flex flex-col items-center text-center">
          <Link
            href="/"
            aria-label={`${SITE.name} — home`}
            className="block rounded-full"
          >
            {avatarSrc ? (
              // The cutout portrait — public/avatar.webp, transparent. Depth
              // is layered, after the reference: a blurred glow behind, the
              // figure with a drop-shadow, a fade at the shoulders (all in
              // `.portrait`, design/tokens.css). `data-tilt` adds the pointer
              // parallax from page-motion.tsx; the stage is what tilts.
              <span
                data-tilt
                className="portrait size-[clamp(132px,21vh,190px)]"
              >
                <span className="portrait__stage">
                  <span aria-hidden="true" className="portrait__glow" />
                  {/* A plain <img>: a static export ships with image
                      optimisation off. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarSrc}
                    alt=""
                    width={512}
                    height={512}
                    className={cn(
                      "portrait__img",
                      avatarDarkSrc && "theme-img--light",
                    )}
                  />
                  {avatarDarkSrc && (
                    // The same shot in a white hoodie for the dark theme,
                    // crossfaded in by `.dark` (`.theme-img--*`). Aligned
                    // with the one above by scripts/media/avatar.mjs.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarDarkSrc}
                      alt=""
                      width={512}
                      height={512}
                      className="portrait__img theme-img--dark"
                    />
                  )}
                </span>
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="grid size-[clamp(132px,21vh,190px)] place-items-center rounded-full border border-line bg-accent-soft font-display text-3xl font-bold tracking-tight text-accent shadow-soft"
              >
                JLR
              </span>
            )}
          </Link>

          <p className="mt-5 inline-flex items-center gap-1.5 font-display text-lg font-bold tracking-tight">
            {SITE.name}
            <VerifiedBadge size={18} />
          </p>
          <p className="mt-1 text-sm text-text-3">
            @ancientsky14
            <VisitCount />
          </p>

          <div className="mt-6 flex items-center gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${s.label} — ${s.handle} (opens in a new tab)`}
                title={s.label}
                className={ROUND}
              >
                <BrandIcon id={s.id} size={17} />
              </a>
            ))}
            <ThemeToggle className="size-11 border-line bg-surface text-text shadow-soft" />
          </div>
        </div>

        {/* my-5, not my-7: the search row below costs height the rail does
            not have at 1280x720 (Phase 4, measured against the nav). */}
        <div aria-hidden="true" className="my-5 h-px bg-line" />

        {/* search — opens the Ctrl+K palette (Phase 4) */}
        <div className="mb-2">
          <SearchButton variant="rail" />
        </div>

        {/* nav */}
        <nav
          aria-label="Main"
          className="flex-1"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((l) => {
              const active =
                l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              const Icon = l.icon;

              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-[clamp(46px,6vh,54px)] items-center gap-4 rounded-lg border px-4 text-base font-medium transition-colors",
                      active
                        ? "border-line bg-surface font-semibold text-text shadow-soft"
                        : "border-transparent text-text-2 hover:bg-surface/60 hover:text-text",
                    )}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className={active ? "text-accent" : "text-text-3"}
                    />
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* footer — the fixed accessibility button (components/shell/
            a11y-panel.tsx) sits bottom-left beside this on desktop, so the
            text is inset to clear it. */}
        <div className="mt-7 border-t border-line pt-[clamp(24px,4vh,40px)]">
          <p className="min-h-12 pl-13 text-xs leading-relaxed text-text-3">
            © {new Date().getFullYear()}
            <br />
            {SITE.name}. All rights reserved.
          </p>
          {/* Design credit — plain text, never a link (lib/site.ts). */}
          <p className="mt-2 pl-13 text-xs leading-relaxed text-text-3">
            {SITE.credit}
          </p>
        </div>
      </div>
    </aside>
  );
}
