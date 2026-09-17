import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  FlaskConical,
  NotebookPen,
  PackageCheck,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { getAllLab, QUEUED, type LabKind } from "@/lib/lab";
import { latestRelease } from "@/lib/releases";
import { ToolIcon } from "@/components/icons/tool-icon";
import { BgReplay } from "@/components/lab/bg-replay";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Experiments and engineering notes — how the systems were built, each with its proof.",
};

/**
 * Lab — the half of the site that isn't a pitch.
 *
 *   Featured   the entry marked `featured` (the Archipelago): its spec
 *              tiles, and "Watch it assemble", which replays the live
 *              background behind the page (components/lab/bg-replay.tsx)
 *   Entries    every other note, each naming where it can be checked
 *   Release    the latest signed eBudget release, read from the public
 *              feed at build time (lib/releases.ts); absent if GitHub is
 *              unreachable during the build
 *   On the bench   write-ups that are real work but not yet notes, each
 *              with what it is waiting on (QUEUED in lib/lab.ts)
 *
 * Entries come from content/lab/*.mdx via lib/lab.ts. Note bodies are gated
 * on `bodyReviewed`; the cards are not, because nothing on them is prose
 * Jan has not seen the source of.
 */

const KIND_ICON: Record<LabKind, LucideIcon> = {
  Experiment: FlaskConical,
  Note: NotebookPen,
  "Open source": PackageCheck,
};

const DATE = new Intl.DateTimeFormat("en-PH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Manila",
});

function Stack({ tools }: { tools?: string[] }) {
  if (!tools?.length) return null;
  return (
    // Tighter below sm so a row of three fits one line on a phone: at 375px
    // the default spacing ran 2–16px over and wrapped (R20). Icons, text size
    // and chip height are unchanged; from sm up nothing changes.
    <ul className="flex flex-wrap gap-1 sm:gap-1.5">
      {tools.map((t) => (
        <li
          key={t}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface py-1 pl-1.5 pr-2 font-mono text-2xs text-text-2 sm:gap-1.5 sm:pl-2 sm:pr-2.5"
        >
          <ToolIcon name={t} size={12} brand />
          {t}
        </li>
      ))}
    </ul>
  );
}

export default async function Lab() {
  const entries = getAllLab();
  const featured = entries.find((e) => e.featured);
  const rest = entries.filter((e) => e !== featured);
  const release = await latestRelease();

  return (
    <>
      <section className="border-b border-line px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <p className="font-mono text-2xs font-semibold uppercase tracking-widest text-accent">
          Lab
        </p>
        <h1
          data-split
          className="mt-4 font-display text-3xl font-extrabold leading-none tracking-tight text-text lg:text-4xl"
        >
          Notes from the workbench.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-text-2">
          The half of the site that isn&rsquo;t a pitch &mdash; experiments,
          and notes on how the systems were built. Every entry says where it
          can be checked.
        </p>

        {/* ── featured ─────────────────────────────────────────── */}
        {featured ? (
          <div data-reveal className="frame mt-10 p-2 sm:p-3">
            <div className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-lg border border-line bg-surface xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div className="p-6 sm:p-8 xl:p-10">
                <p className="font-mono text-2xs font-semibold uppercase tracking-widest text-accent">
                  {featured.kind} · {featured.year}
                </p>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-text">
                  {featured.title}
                </h2>
                {featured.subtitle ? (
                  <p className="mt-2 text-text-3">{featured.subtitle}</p>
                ) : null}
                <p className="mt-5 max-w-xl leading-relaxed text-text-2">
                  {featured.blurb}
                </p>
                <div className="mt-6">
                  <Stack tools={featured.stack} />
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <BgReplay />
                  <Link
                    href={`/lab/${featured.slug}`}
                    className="inline-flex items-center rounded-full border border-line-2 bg-surface px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-accent"
                  >
                    Read the note
                  </Link>
                  {featured.source ? (
                    <a
                      href={featured.source.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group inline-flex items-center gap-1.5 px-2 py-2.5 text-sm font-semibold text-text-2 transition-colors hover:text-accent"
                    >
                      {featured.source.label}
                      <ArrowUpRight
                        size={15}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="transition-transform duration-300 ease-(--ease-out) group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </a>
                  ) : null}
                </div>
                {featured.proof ? (
                  <p className="mt-4 inline-flex items-center gap-2 text-sm text-text-3">
                    <span aria-hidden="true" className="size-2 rounded-full bg-ok" />
                    {featured.proof}
                  </p>
                ) : null}
              </div>

              {featured.facts?.length ? (
                <dl
                  data-reveal-group
                  className="grid grid-cols-2 gap-px border-t border-line bg-line xl:border-l xl:border-t-0"
                >
                  {featured.facts.map((f) => (
                    // Top-aligned below xl: on a narrow phone some labels
                    // wrap to two lines, and bottom-pinning pushed the
                    // one-line cell's number ~22px below its neighbour's.
                    // From xl the cells are tall and every label fits one
                    // line, so the numbers sit at the bottom by design.
                    <div
                      key={f.label}
                      className="flex flex-col justify-start bg-surface-2 p-6 xl:justify-end"
                    >
                      <dt className="order-2 mt-1 text-sm text-text-3">
                        {f.label}
                      </dt>
                      <dd className="order-1 font-display text-2xl font-bold tabular-nums tracking-tight text-text">
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* ── entries ──────────────────────────────────────────── */}
        {rest.length ? (
          <ul data-reveal-group className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
            {rest.map((e) => {
              const Icon = KIND_ICON[e.kind] ?? NotebookPen;
              return (
                <li key={e.slug}>
                  <Link
                    href={`/lab/${e.slug}`}
                    data-spotlight
                    data-tilt-card
                    className="group flex h-full flex-col rounded-lg border border-line bg-surface p-6 shadow-soft transition-colors hover:border-accent sm:p-7"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        data-tilt-icon
                        className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-ink"
                      >
                        <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <span className="font-mono text-2xs uppercase tracking-widest text-text-3">
                        {e.kind} · {e.year}
                      </span>
                    </div>
                    <h2 className="mt-5 font-display text-xl font-bold leading-tight tracking-tight text-text transition-colors group-hover:text-accent">
                      {e.title}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-text-2">
                      {e.blurb}
                    </p>
                    {e.proof ? (
                      <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-text">
                        <ShieldCheck
                          size={15}
                          strokeWidth={1.75}
                          aria-hidden="true"
                          className="text-accent"
                        />
                        {e.proof}
                      </p>
                    ) : null}
                    <div className="mt-5 flex items-end justify-between gap-4 border-t border-line pt-5">
                      <Stack tools={e.stack} />
                      <ArrowUpRight
                        size={20}
                        strokeWidth={1.75}
                        aria-hidden="true"
                        className="shrink-0 text-text-3 transition-all duration-300 ease-(--ease-out) group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        {/* ── the latest release, read at build time ──────────── */}
        {/* Information only, no link (Jan, 2026-09-17, R20): no GitHub links
            on the site, so neither the repo name nor a "View release".
            Three rows on a phone — icon + label, name, date — where one
            wrapped line ran the repo name down five lines. From sm the icon
            takes its own column and the three lines sit beside it. */}
        {release ? (
          <div
            data-reveal
            className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-surface p-5 shadow-soft sm:gap-x-5 sm:p-6"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent sm:row-span-3">
              <PackageCheck size={19} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <p className="font-mono text-2xs uppercase tracking-widest text-text-3">
              Latest signed release
            </p>
            <p className="col-span-2 mt-2 font-semibold text-text sm:col-span-1 sm:col-start-2 sm:mt-0">
              {release.name}
            </p>
            <p className="col-span-2 text-sm text-text-3 sm:col-span-1 sm:col-start-2">
              Published{" "}
              <time dateTime={release.publishedAt}>
                {DATE.format(new Date(release.publishedAt))}
              </time>
            </p>
          </div>
        ) : null}
      </section>

      {/* ── on the bench ──────────────────────────────────────── */}
      <section className="border-b border-line px-5 py-14 sm:px-8 lg:px-12">
        <h2 className="font-mono text-2xs uppercase tracking-widest text-text-3">
          On the bench
        </h2>
        <p className="mt-3 max-w-2xl text-text-2">
          Real work, not yet written up. Each goes up when it is written, not as
          a placeholder.
        </p>
        <ul data-reveal-group className="mt-6 max-w-3xl border-t border-line">
          {QUEUED.map((q) => (
            <li
              key={q.title}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line py-4"
            >
              <span className="min-w-0">
                <span className="block font-semibold text-text">{q.title}</span>
                <span className="mt-0.5 block font-mono text-2xs uppercase tracking-widest text-text-3">
                  {q.kind}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-text-2">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-warn" />
                {q.status}
              </span>
            </li>
          ))}
        </ul>

        <Link
          href="/writing"
          className="mt-8 inline-flex w-fit items-center gap-2 border-b border-line-2 pb-0.5 text-sm text-text transition-colors hover:border-accent"
        >
          Longer pieces go under Writing
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </section>
    </>
  );
}
