import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { SITE } from "@/lib/site";
import { BookCall } from "@/components/site/book-call";

/**
 * Home hero — laid out after the reference: one very large headline, the
 * dark "Get in touch" pill top-right, and a short lede underneath.
 *
 * The headline is the product-developer positioning in
 * content/positioning.md, signed off by Jan on 2026-09-11. The lede
 * underneath comes from SITE.line / SITE.sub.
 *
 * Two CTAs because the site has two audiences: clients ("Get in touch")
 * and employers ("Hire me", which lands on the #hire block on /about). A
 * third, "Book a 30-min call", appears under them once SITE.bookingUrl is
 * set.
 *
 * Behind it: the poster wash (in the HTML, the default). The Archipelago point
 * cloud is the site-wide background now, mounted in app/layout.tsx. Each
 * headline line sits in its own overflow mask so Phase R4's GSAP reveal can
 * lift it; the reduced-motion branch leaves every line in place.
 */

const LINES = ["Software that ships.", "And keeps running."];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-5 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-14 lg:px-12 lg:pt-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background:radial-gradient(55%_60%_at_85%_10%,var(--accent-soft),transparent_70%),radial-gradient(40%_50%_at_10%_100%,color-mix(in_oklab,var(--sand)_18%,transparent),transparent_70%)]"
      />

      {/* Headline and buttons stack (headline first) below 1100px and sit
          side by side from 1100px, as on the reference — side by side on a
          narrower panel crushed the headline into six lines. The 1100px
          switch lives in `.home-fit__head` (design/tokens.css), not in a
          Tailwind `min-[1100px]:` class: see the note there. */}
      <div className="home-fit__head flex flex-col gap-4 sm:gap-6">
        <h1 className="home-fit__title min-w-0 font-display text-2xl font-extrabold leading-none tracking-tight text-text sm:text-3xl lg:text-4xl">
          {LINES.map((line) => (
            // Each outer span is the mask the line rises out of. Both are
            // painted and readable before any script runs.
            <span
              key={line}
              className="block overflow-hidden pb-2 xl:mr-4 xl:inline-block"
            >
              <span className="hero-line block">{line}</span>
            </span>
          ))}
        </h1>

        {/* `.home-fit__actions` (design/tokens.css) puts a third button on
            its own row from 1100px, so the headline keeps its width. */}
        <div className="home-fit__actions flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/contact"
            data-magnetic
            className="group inline-flex w-fit items-center gap-2 rounded-full bg-text py-3 pl-6 pr-5 text-sm font-semibold text-ground transition-opacity hover:opacity-90"
          >
            Get in touch
            <ArrowUpRight
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className="text-accent-soft transition-transform duration-300 ease-(--ease-out) group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
          <Link
            href="/about#hire"
            data-magnetic
            className="inline-flex w-fit items-center rounded-full border border-line-2 bg-surface/70 px-5 py-3 text-sm font-semibold text-text backdrop-blur-sm transition-colors hover:border-accent"
          >
            Hire me
          </Link>
          {/* Only on the fitted home; elsewhere it sits with the email
              below, so a phone's first screen keeps two buttons and reaches
              the proof (R10). The switch is in design/tokens.css with the
              rest of the 1100px rules. */}
          <BookCall className="hero-book--fit bg-surface/70 backdrop-blur-sm" />
        </div>
      </div>

      <p className="home-fit__lede measure mt-4 text-lg leading-relaxed text-text-2 sm:mt-6">
        {SITE.line} {SITE.sub}
      </p>

      <div className="home-fit__mail mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-5">
        <a
          href={`mailto:${SITE.email}`}
          className="inline-flex min-h-11 items-center gap-2 text-sm text-text-2 transition-colors hover:text-accent"
        >
          <Mail size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="underline decoration-line-2 underline-offset-4">
            {SITE.email}
          </span>
        </a>
        <BookCall className="hero-book--flow bg-surface/70 py-2.5 backdrop-blur-sm" />
      </div>
    </section>
  );
}
