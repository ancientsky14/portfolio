import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Download, Mail } from "lucide-react";
import { SITE } from "@/lib/site";
import { cvHref } from "@/lib/cv";
import { ToolIcon } from "@/components/icons/tool-icon";
import { AboutCard } from "@/components/about/about-card";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE.line} Full-stack developer in the Philippines — open to projects and full-time roles.`,
};

/**
 * About — who you would be hiring, as a client or as an employer.
 *
 * Laid out after the reference's About page: an eyebrow, a big greeting,
 * one line, then the About card (components/about/about-card.tsx) — story,
 * role rows, credentials and the figure. Then the way in for a client, the
 * after-launch promise, and `#hire` for employers.
 *
 * Everything here is checkable: project facts come from content/work/*.mdx,
 * tools from lib/stack.ts, credentials and the story from the gates in
 * lib/about.ts. The story is still a NEEDS there — until Jan gives it, the
 * card renders a fallback built only from the case studies.
 *
 * `#hire` is where the home page's "Hire me" lands. The CV button renders
 * only if public/cv.pdf exists — see lib/cv.ts.
 */

/** Skills grouped the way a recruiter scans them. Every item is in lib/stack.ts. */
const SKILLS: { area: string; tools: string[] }[] = [
  { area: "Frontend", tools: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
  { area: "Desktop", tools: ["Tauri", "Rust"] },
  { area: "Data", tools: ["PostgreSQL", "Supabase", "SQLite", "PocketBase"] },
  { area: "Delivery", tools: ["Docker", "Cloudflare Workers", "Vite"] },
];

export default function About() {
  const cv = cvHref();

  return (
    <>
      <section className="border-b border-line px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <p className="font-mono text-2xs font-semibold uppercase tracking-widest text-accent">
          About
        </p>

        <h1
          data-split
          className="mt-4 font-display text-3xl font-extrabold leading-none tracking-tight text-text lg:text-4xl"
        >
          Hi, I&rsquo;m Jan.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-text-2">{SITE.line}</p>

        <AboutCard />

        {/* The way in, for a client — the reference stops at the card. */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/contact"
            data-magnetic
            className="group inline-flex items-center gap-2 rounded-full bg-text py-3 pl-6 pr-5 text-sm font-semibold text-ground transition-opacity hover:opacity-90"
          >
            Start a project
            <ArrowUpRight
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className="text-accent-soft transition-transform duration-300 ease-(--ease-out) group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
          <Link
            href="/work"
            data-magnetic
            className="inline-flex items-center rounded-full border border-line-2 bg-surface px-5 py-3 text-sm font-semibold text-text transition-colors hover:border-accent"
          >
            See the work
          </Link>
        </div>

        {/* "After launch" — step 4 in lib/engagement.ts. The earlier
            ownership stance was withdrawn on 2026-09-11; no ownership or
            payment terms here. */}
        <div
          data-reveal
          className="mt-12 max-w-2xl rounded-lg border border-line bg-surface p-6 shadow-soft sm:p-8"
        >
          <p className="font-mono text-2xs uppercase tracking-widest text-accent">
            After launch
          </p>
          <p className="mt-4 text-lg text-text-2">
            I stay on. Fixes, updates and new features come from the person who
            built it — no handover to a stranger.
          </p>
        </div>
      </section>

      {/* HIRE — the landing spot for "Hire me" */}
      <section
        id="hire"
        className="scroll-mt-20 border-b border-line px-5 py-16 sm:px-8 lg:px-12"
      >
        <p className="font-mono text-2xs uppercase tracking-widest text-accent">
          Hiring?
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-2xl font-bold tracking-tight">
          Open to full-time roles as well as projects.
        </h2>
        <p className="mt-4 max-w-2xl text-text-2">
          I work across the stack — interface, database, desktop and delivery —
          and I&rsquo;m used to owning a product from the first commit to the
          release that installs itself.
        </p>

        <dl
          data-reveal-group
          className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2"
        >
          {SKILLS.map((s) => (
            <div
              key={s.area}
              className="rounded-lg border border-line bg-surface p-5 shadow-soft"
            >
              <dt className="font-mono text-2xs uppercase tracking-widest text-text-3">
                {s.area}
              </dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {s.tools.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-text"
                  >
                    <ToolIcon name={t} size={14} />
                    {t}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {cv ? (
            <a
              href={cv}
              download="Jan-Luigi-Rivera-CV.pdf"
              className="inline-flex items-center gap-2 rounded-full bg-text py-2.5 pl-4 pr-5 text-sm font-semibold text-ground transition-opacity hover:opacity-90"
            >
              <Download size={16} strokeWidth={2} aria-hidden="true" />
              Download CV
            </a>
          ) : null}
          <a
            href={`mailto:${SITE.email}?subject=${encodeURIComponent("Job opportunity")}`}
            className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface py-2.5 pl-4 pr-5 text-sm font-semibold text-text transition-colors hover:border-accent"
          >
            <Mail size={16} strokeWidth={2} aria-hidden="true" />
            Email me about a role
          </a>
        </div>

        {/* No socials here (R16). They sat ~280px above the footer's copy on a
            phone and only 142px above it at 1280 — the shell already carries
            them once per viewport, and /contact has the full list with a
            handle and a note per profile. This block is for the two actions a
            recruiter came for: the CV and the email. */}
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-accent"
            />
            <span className="font-mono text-2xs uppercase tracking-widest text-text-2">
              {SITE.availability}
            </span>
          </p>
        </div>
      </section>
    </>
  );
}
