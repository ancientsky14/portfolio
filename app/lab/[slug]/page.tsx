import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  FileText,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { getAllLab, getLab, getLabSlugs } from "@/lib/lab";
import { prepareBody, bodyVisibility } from "@/lib/mdx";
import { openGraphFor } from "@/lib/og";
import { labNoteLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { ToolIcon } from "@/components/icons/tool-icon";
import { BgReplay } from "@/components/lab/bg-replay";

/**
 * A lab note — the same shape as a case study (app/work/[slug]/page.tsx),
 * and the same publishing gate: the body renders in production only once
 * its frontmatter says `bodyReviewed: true`. In `next dev` it renders under
 * a draft banner so it can be read in the real layout. The title, summary,
 * proof and source render either way — they are checked facts.
 */

// `output: "export"` — every slug is known at build time, nothing else is.
export const dynamicParams = false;

export function generateStaticParams() {
  return getLabSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = getLab(slug);
  if (!e) return {};
  return {
    title: `${e.title} — Lab`,
    description: e.blurb,
    openGraph: openGraphFor(`lab-${e.slug}`, `${e.kind}: ${e.title}`),
  };
}

export default async function LabNote({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = getLab(slug);
  if (!e) notFound();

  const visibility = bodyVisibility(e);
  const body = visibility === "hidden" ? "" : prepareBody(e.body);

  const all = getAllLab();
  const next = all[(all.findIndex((x) => x.slug === e.slug) + 1) % all.length];

  return (
    <article>
      <JsonLd data={labNoteLd(e)} />
      <header className="border-b border-line px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <Link
          href="/lab"
          className="group inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-text-3 transition-colors hover:text-accent"
        >
          <ArrowRight
            size={14}
            strokeWidth={1.75}
            aria-hidden="true"
            className="rotate-180 transition-transform duration-300 ease-(--ease-out) group-hover:-translate-x-0.5"
          />
          All lab
        </Link>

        <p className="mt-8 font-mono text-2xs font-semibold uppercase tracking-widest text-accent">
          {e.kind} · {e.year}
        </p>
        <h1
          data-split
          className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
        >
          {e.title}
        </h1>
        {e.subtitle ? (
          <p className="mt-3 max-w-2xl text-lg text-text-2">{e.subtitle}</p>
        ) : null}
        <p className="mt-8 max-w-2xl leading-relaxed text-text-2">{e.blurb}</p>
        {/* The note is about the background itself, so let the reader watch
            it. The wrapper is gated the same way as the button, or a phone
            without the canvas would get an empty 32px gap here. */}
        {e.slug === "archipelago" ? (
          <div className="bg-live-only mt-8">
            <BgReplay />
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:gap-16 lg:px-12">
        <div className="min-w-0 max-w-prose">
          {visibility === "draft" ? (
            <div className="mb-10 rounded-md border border-warn bg-surface p-5">
              <p className="font-mono text-2xs uppercase tracking-widest text-warn">
                Draft — visible in dev only
              </p>
              <p className="mt-2 text-sm text-text-2">
                This note has not been reviewed yet. It does not ship in the
                GitHub Pages build until{" "}
                <code className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
                  bodyReviewed: true
                </code>{" "}
                is set in its frontmatter.
              </p>
            </div>
          ) : null}

          {body ? (
            <MDXRemote source={body} components={mdxComponents} />
          ) : (
            <div className="rounded-md border border-line bg-surface p-6 shadow-soft">
              <FileText
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-accent"
              />
              <p className="mt-3 text-sm text-text-2">
                The full note is being reviewed before it goes up. The summary
                above and the details alongside are current.
              </p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <dl className="flex flex-col gap-5 rounded-md border border-line bg-surface p-6 shadow-soft">
            <div>
              <dt className="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-text-3">
                <FlaskConical size={14} strokeWidth={1.75} aria-hidden="true" />
                Kind
              </dt>
              <dd className="mt-1 text-sm text-text">{e.kind}</dd>
            </div>

            <div>
              <dt className="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-text-3">
                <CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" />
                Year
              </dt>
              <dd className="mt-1 text-sm tabular-nums text-text">{e.year}</dd>
            </div>

            {e.proof ? (
              <div>
                <dt className="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-text-3">
                  <ShieldCheck size={14} strokeWidth={1.75} aria-hidden="true" />
                  Proof
                </dt>
                <dd className="mt-1 text-sm text-text">{e.proof}</dd>
              </div>
            ) : null}

            {e.stack?.length ? (
              <div>
                <dt className="font-mono text-2xs uppercase tracking-widest text-text-3">
                  Stack
                </dt>
                <dd className="mt-3">
                  <ul className="flex flex-wrap gap-1.5">
                    {e.stack.map((s) => (
                      <li
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-0.5 pl-2 pr-2.5 font-mono text-2xs text-text-2"
                      >
                        <ToolIcon name={s} size={11} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}

            {e.source ? (
              <a
                href={e.source.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-text transition-colors hover:text-accent"
              >
                {e.source.label}
                <ArrowUpRight
                  size={15}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="transition-transform duration-300 ease-(--ease-out) group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            ) : null}
          </dl>
        </aside>
      </div>

      {next && next.slug !== e.slug ? (
        <nav
          aria-label="Next lab entry"
          className="border-t border-line px-5 py-10 sm:px-8 lg:px-12"
        >
          <Link
            href={`/lab/${next.slug}`}
            data-spotlight
            className="group flex items-center justify-between gap-6 rounded-md border border-line bg-surface p-6 shadow-soft transition-colors hover:border-accent"
          >
            <span>
              <span className="block font-mono text-2xs uppercase tracking-widest text-text-3">
                Next in the lab
              </span>
              <span className="mt-1 block font-display text-xl font-semibold tracking-tight transition-colors group-hover:text-accent">
                {next.title}
              </span>
            </span>
            <ArrowUpRight
              size={22}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-text-3 transition-all duration-300 ease-(--ease-out) group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
            />
          </Link>
        </nav>
      ) : null}
    </article>
  );
}
