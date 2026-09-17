import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  FileText,
  Globe,
  MousePointerClick,
  PackageCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  getAllWork,
  getWork,
  getWorkSlugs,
  displayClient,
  realMetrics,
} from "@/lib/content";
import { prepareBody, bodyVisibility } from "@/lib/mdx";
import { liveLinks, checkLive, hostOf, type LiveKind } from "@/lib/live";
import { mediaFor } from "@/lib/shots";
import { openGraphFor } from "@/lib/og";
import { caseStudyLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { ToolIcon } from "@/components/icons/tool-icon";
import { WorkBadges } from "@/components/work/badges";
import { LivePreview } from "@/components/work/live-preview";

const LIVE_ICON: Record<LiveKind, LucideIcon> = {
  production: Globe,
  demo: MousePointerClick,
  release: PackageCheck,
};

const DATE = new Intl.DateTimeFormat("en-PH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Manila",
});

// `output: "export"` — every slug is known at build time, nothing else is.
export const dynamicParams = false;

export function generateStaticParams() {
  return getWorkSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = getWork(slug);
  if (!w) return {};
  const title = w.fullName ? `${w.title} — ${w.fullName}` : w.title;
  return {
    title,
    description: w.summary,
    openGraph: openGraphFor(
      `work-${w.slug}`,
      w.subtitle ? `${title}: ${w.subtitle}` : title,
    ),
  };
}

const bare = (s: string) => s.replace(/\s+\d+(\.\d+)*$/, "");

export default async function CaseStudy({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const w = getWork(slug);
  if (!w) notFound();

  const metrics = realMetrics(w);
  const visibility = bodyVisibility(w);
  const body = visibility === "hidden" ? "" : prepareBody(w.body);

  const all = getAllWork();
  const next = all[(all.findIndex((x) => x.slug === w.slug) + 1) % all.length];

  // Live links and their build-time status (lib/live.ts), and the preview's
  // recording or screenshot (lib/shots.ts).
  const links = liveLinks(w);
  const statuses = await Promise.all(links.map((l) => checkLive(l.href)));
  const webLink = links.find((l) => l.kind !== "release");
  const media = mediaFor(w.slug);

  return (
    <article>
      <JsonLd data={caseStudyLd(w)} />
      <header className="border-b border-line px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <Link
          href="/work"
          className="group inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-text-3 transition-colors hover:text-accent"
        >
          <ArrowRight
            size={14}
            strokeWidth={1.75}
            aria-hidden="true"
            className="rotate-180 transition-transform duration-300 ease-(--ease-out) group-hover:-translate-x-0.5"
          />
          All work
        </Link>

        <h1 data-split className="mt-8 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {w.title}
        </h1>
        {w.fullName ? (
          <p className="mt-3 font-mono text-2xs font-semibold uppercase tracking-widest text-accent">
            {w.fullName}
          </p>
        ) : null}
        {w.subtitle ? (
          <p className="mt-3 max-w-2xl text-lg text-text-2">{w.subtitle}</p>
        ) : null}

        <WorkBadges w={w} className="mt-6" />

        {/* See it live — the real site, a demo or a release feed. */}
        {links.length ? (
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-4">
            {links.map((l, i) => {
              const Icon = LIVE_ICON[l.kind];
              const s = statuses[i];
              return (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-magnetic
                    className={
                      i === 0
                        ? "group inline-flex items-center gap-2.5 rounded-full bg-text py-3 pl-5 pr-5 text-sm font-semibold text-ground transition-opacity hover:opacity-90"
                        : "group inline-flex items-center gap-2.5 rounded-full border border-line-2 bg-surface py-3 pl-5 pr-5 text-sm font-semibold text-text transition-colors hover:border-accent"
                    }
                  >
                    <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                    {l.label}
                    <ArrowUpRight
                      size={15}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="transition-transform duration-300 ease-(--ease-out) group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </a>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 pl-1 text-xs text-text-3">
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${s?.up ? "bg-ok" : "bg-warn"}`}
                    />
                    {s?.up ? "Online" : "Offline at last build"}
                    {s ? (
                      <>
                        {" · checked "}
                        <time dateTime={s.checkedAt}>
                          {DATE.format(new Date(s.checkedAt))}
                        </time>
                      </>
                    ) : null}
                    {l.note ? <span>· {l.note}</span> : null}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : null}

        {w.summary ? (
          <p className="mt-8 max-w-2xl leading-relaxed text-text-2">
            {w.summary}
          </p>
        ) : null}
      </header>

      {/* The moving preview — a recording from synthetic data in the frame
          of what it is. Not an iframe: the live systems refuse framing. */}
      <div className="border-b border-line px-5 py-10 sm:px-8 lg:px-12">
        <div className="max-w-5xl">
          <LivePreview
            title={w.title}
            platform={w.platform}
            status={w.status}
            host={webLink ? hostOf(webLink.href) : undefined}
            media={media}
          />
          {w.previewNote ? (
            <p className="mt-3 text-sm text-text-3">{w.previewNote}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:gap-16 lg:px-12">
        {/* Prose */}
        <div className="min-w-0 max-w-prose">
          {visibility === "draft" ? (
            <div className="mb-10 rounded-md border border-warn bg-surface p-5">
              <p className="font-mono text-2xs uppercase tracking-widest text-warn">
                Draft — visible in dev only
              </p>
              <p className="mt-2 text-sm text-text-2">
                This body still contains INFERRED lines. It does not ship in the
                GitHub Pages build until{" "}
                <code className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
                  bodyReviewed: true
                </code>{" "}
                is set in the frontmatter — after you have corrected it.
              </p>
            </div>
          ) : null}

          {body ? (
            <MDXRemote source={body} components={mdxComponents} />
          ) : (
            <div className="rounded-md border border-glass-line bg-glass p-6 backdrop-blur-xl">
              <FileText
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-accent"
              />
              <p className="mt-3 text-sm text-text-2">
                The full write-up — the situation before, the constraints, the
                architecture and the handover terms — is being prepared. The
                summary above and the details alongside are current.
              </p>
            </div>
          )}
        </div>

        {/* Details */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <dl className="flex flex-col gap-5 rounded-md border border-glass-line bg-glass p-6 backdrop-blur-xl">
            <div>
              <dt className="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-text-3">
                <Building2 size={14} strokeWidth={1.75} aria-hidden="true" />
                Client
              </dt>
              <dd className="mt-1 text-sm text-text">{displayClient(w)}</dd>
              {w.sector ? (
                <dd className="mt-0.5 text-xs text-text-3">{w.sector}</dd>
              ) : null}
            </div>

            {w.year ? (
              <div>
                <dt className="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-text-3">
                  <CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" />
                  Year
                </dt>
                <dd className="mt-1 text-sm tabular-nums text-text">
                  {w.year}
                </dd>
              </div>
            ) : null}

            {w.role ? (
              <div>
                <dt className="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-text-3">
                  <UserRound size={14} strokeWidth={1.75} aria-hidden="true" />
                  Role
                </dt>
                <dd className="mt-1 text-sm text-text">{w.role}</dd>
              </div>
            ) : null}

            {/* Live — cleared links only (lib/live.ts), each with the
                status the build found. */}
            {links.length ? (
              <div>
                <dt className="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-text-3">
                  <Globe size={14} strokeWidth={1.75} aria-hidden="true" />
                  Live
                </dt>
                {links.map((l, i) => (
                  <dd key={l.href} className="mt-1 text-sm">
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 text-text underline decoration-line-2 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                    >
                      <span
                        aria-hidden="true"
                        className={`size-1.5 shrink-0 rounded-full ${statuses[i]?.up ? "bg-ok" : "bg-warn"}`}
                      />
                      {hostOf(l.href)}
                    </a>
                  </dd>
                ))}
              </div>
            ) : null}

            {/* Only metrics with a real value render — realMetrics() drops
                every null. Three true numbers beat six invented ones. */}
            {metrics.length ? (
              <div>
                <dt className="font-mono text-2xs uppercase tracking-widest text-text-3">
                  By the numbers
                </dt>
                <dd className="mt-2">
                  <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line">
                    {metrics.map((m) => (
                      <li key={m.label} className="bg-surface p-3 last:odd:col-span-2">
                        <span className="block font-display text-lg font-semibold tabular-nums text-text">
                          {m.value}
                        </span>
                        <span className="mt-0.5 block text-xs text-text-3">
                          {m.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}

            {w.stack?.length ? (
              <div>
                <dt className="font-mono text-2xs uppercase tracking-widest text-text-3">
                  Stack
                </dt>
                <dd className="mt-3">
                  <ul className="flex flex-wrap gap-1.5">
                    {w.stack.map((s) => (
                      <li
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-0.5 pl-2 pr-2.5 font-mono text-2xs text-text-2"
                      >
                        <ToolIcon name={bare(s)} size={11} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>

      {next && next.slug !== w.slug ? (
        <nav
          aria-label="Next case study"
          className="border-t border-line px-5 py-10 sm:px-8 lg:px-12"
        >
          <Link
            href={`/work/${next.slug}`}
            data-spotlight
            className="group flex items-center justify-between gap-6 rounded-md border border-glass-line bg-glass p-6 backdrop-blur-xl transition-colors hover:border-accent"
          >
            <span>
              <span className="block font-mono text-2xs uppercase tracking-widest text-text-3">
                Next case study
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
