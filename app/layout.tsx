import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Public_Sans,
  JetBrains_Mono,
} from "next/font/google";
import { Rail } from "@/components/shell/rail";
import { MobileBar } from "@/components/shell/mobile-bar";
import { PanelFooter } from "@/components/shell/panel-footer";
import { PageMotionLazy } from "@/components/motion/page-motion-lazy";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { SITE } from "@/lib/site";
import { contentSecurityPolicy } from "@/lib/csp";
import { INTRO } from "@/lib/motion";
import { avatarDarkSrc, avatarSrc } from "@/lib/avatar";
import { openGraphFor } from "@/lib/og";
import { personLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import { A11yPanel } from "@/components/shell/a11y-panel";
import { TabBar } from "@/components/shell/tab-bar";
import { BootIntro } from "@/components/motion/boot-intro";
import { Archipelago } from "@/components/hero/archipelago";
import { Optional } from "@/components/site/optional";
import { SearchLauncher } from "@/components/shell/search-launcher";
import { buildSearchIndex } from "@/lib/search-index";
import "./globals.css";

/* The three faces from the design direction. The CSS variable names here
   are the ones design/tokens.css maps into --font-display / --font-sans /
   --font-mono — rename in both places or neither. */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const sans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Jan Luigi Rivera — Full-stack developer",
    template: "%s · Jan Luigi Rivera",
  },
  description: `${SITE.line} ${SITE.sub}`,
  // The site card (app/og), inherited by every page without its own.
  openGraph: openGraphFor("site", `${SITE.name} — ${SITE.line}`),
  twitter: { card: "summary_large_image" },
  // Other sites see the origin only, never which page linked them (R23).
  referrer: "strict-origin-when-cross-origin",
};

/**
 * Theme boot. Runs before first paint so a returning dark-theme visitor
 * never sees a flash of the light ground.
 *
 * Light is the default: with no stored preference this sets nothing, which
 * is deliberate — the site is light-first and only respects `prefers-color-
 * scheme: dark` as a starting guess, not as a lock.
 */
const THEME_BOOT = `
try{
  var d = document.documentElement;
  var t = localStorage.getItem('theme');
  if(!t && window.matchMedia('(prefers-color-scheme: dark)').matches) t='dark';
  if(t==='dark') d.classList.add('dark');
  var a = JSON.parse(localStorage.getItem('a11y') || 'null');
  if(a){
    if(a.text===1) d.classList.add('a11y-text-1');
    if(a.text===2) d.classList.add('a11y-text-2');
    if(a.contrast) d.classList.add('a11y-contrast');
    if(a.reduceMotion) d.classList.add('a11y-reduce-motion');
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || (a && a.reduceMotion);
  if(!reduce && !sessionStorage.getItem('booted')){
    sessionStorage.setItem('booted','1');
    d.classList.add('is-intro');
    setTimeout(function(){ d.classList.add('is-intro-out'); }, ${INTRO.out});
    setTimeout(function(){ d.classList.remove('is-intro','is-intro-out'); }, ${INTRO.done});
  }
}catch(e){}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const avatar = avatarSrc();
  const avatarDark = avatarDarkSrc();

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* First in <head>: a meta CSP covers only what is parsed after it.
            Production only — see lib/csp.ts. */}
        {process.env.NODE_ENV === "production" ? (
          <meta httpEquiv="Content-Security-Policy" content={contentSecurityPolicy()} />
        ) : null}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <JsonLd data={personLd(avatar)} />
      </head>
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} min-h-dvh bg-ground text-text antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
        >
          Skip to content
        </a>

        {/* Optional: a chunk that fails to load must not take the page down. */}
        <Optional>
          <PageMotionLazy />
        </Optional>
        {/* Ctrl+K search (Phase 4). The index is built here, at build time;
            the palette's own code loads on first open. */}
        <Optional>
          <SearchLauncher entries={buildSearchIndex()} />
        </Optional>
        <ScrollProgress />
        <A11yPanel />
        <BootIntro />
        <TabBar />

        {/* The site-wide background — the Archipelago point cloud, mounted
            once so it survives route changes. Fixed, full-window, behind the
            shell (the shell paints no background of its own), and never
            takes a pointer event: the canvas reads the pointer from the
            window. The gate inside decides whether it mounts at all. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
        >
          <Optional>
            <Archipelago />
          </Optional>
        </div>

        {/* The shell, after the reference: on desktop the page itself never
            scrolls — the rail and the panel are two independent scroll
            areas side by side, the rail with no visible scrollbar, the
            panel with a thin one. Below lg it is an ordinary page that
            scrolls with the window, under the sticky mobile bar.

            Everything that listens to scroll asks lib/scroller.ts which
            element that is. The panel holds a single child on purpose:
            Lenis needs a wrapper (the panel) and one content element. */}
        {/* data-showcase-dim: stepped aside, and made inert, while the /lab
            showcase plays (components/lab/bg-replay.tsx). */}
        <div
          data-showcase-dim
          className="flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:flex-row lg:overflow-hidden"
        >
          <MobileBar avatarSrc={avatar} avatarDarkSrc={avatarDark} />
          <Rail avatarSrc={avatar} avatarDarkSrc={avatarDark} />

          <div
            id="panel"
            className="panel-scroller flex min-w-0 flex-1 flex-col"
          >
            {/* pb clears the mobile tab bar; the rail needs none. 5rem is
                what the bar actually occupies — 65px tall plus its `bottom-3`
                offset is 77px — and the env() term is the part that is easy
                to miss: the bar carries the same inset as a margin
                (components/shell/tab-bar.tsx), so on a notched phone it sits
                ~34px higher than this padding would otherwise allow for. */}
            <div className="flex flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
              {/* A flex column so a page can fill the panel's height —
                  the home page's `.home-fit` does, on wide screens. */}
              <main id="main" className="flex flex-1 flex-col">
                {children}
              </main>
              <PanelFooter />
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
