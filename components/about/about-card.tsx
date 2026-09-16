import Link from "next/link";
import { getAllWork, displayClient, type WorkDoc } from "@/lib/content";
import { SITE } from "@/lib/site";
import {
  ROLES,
  SHIPPED_ICON,
  confirmedCredentials,
  confirmedStory,
} from "@/lib/about";
import { ToolIcon } from "@/components/icons/tool-icon";
import { AboutScene } from "@/components/about/about-scene";

/**
 * The About card — laid out after the reference's: story on the left
 * (two-tone headline, paragraph, numbered role rows, credential chips), a
 * figure on the right on a soft wash.
 *
 * Everything it says is gated in lib/about.ts or read from the case
 * studies, so the card can never claim more than the work behind it:
 *
 *   · the story renders only once Jan confirms it; until then, the
 *     fallback below is built from what the case studies prove
 *   · each role row names its case study and client through
 *     displayClient()
 *   · the "Sole developer" chip is counted from each case study's `status`
 *
 * The figure is the workbench scene (about-scene.tsx) — product windows
 * drawn from the case studies. It replaced Jan's portrait on 2026-09-11.
 *
 * The reference's chatbot bubble is an availability pill here — there is
 * no chatbot, and the pill is a way to the contact page.
 */

const LINK =
  "font-semibold text-text underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:text-accent";

const HEADLINE =
  "font-display text-xl font-bold leading-tight tracking-tight text-text sm:text-2xl";

function Fallback({ bySlug }: { bySlug: Map<string, WorkDoc> }) {
  const w = (slug: string, label: string) =>
    bySlug.has(slug) ? (
      <Link href={`/work/${slug}`} className={LINK}>
        {label}
      </Link>
    ) : (
      label
    );

  return (
    <>
      <h2 className={HEADLINE}>
        I build software end to end.{" "}
        <span className="text-text-3">Then I stay on to keep it running.</span>
      </h2>
      <p className="mt-5 leading-relaxed text-text-2">
        <strong className="font-semibold text-text">
          I&rsquo;m a full-stack developer in the Philippines
        </strong>
        , and on every project here I was the only developer. I&rsquo;ve
        shipped {w("mgb-ebudget", "a Windows desktop app")} with signed
        auto-updates, {w("santol-lmis", "a web platform")} with a role-based
        CMS across three surfaces, and{" "}
        {w("mgb-region-1-etracker", "a tracking portal")} with a full audit
        trail &mdash; and I&rsquo;m building{" "}
        {w("sentro", "an open-source multi-site platform")}.
      </p>
    </>
  );
}

export function AboutCard() {
  const work = getAllWork();
  const bySlug = new Map(work.map((w) => [w.slug, w]));
  const story = confirmedStory();

  const shipped = work.filter((w) => w.status && !/develop|testing/i.test(w.status));
  const building = work.length - shipped.length;
  const [first, ...rest] = confirmedCredentials();
  const chips = [
    ...(first ? [first] : []),
    {
      title: "Sole developer",
      meta: `${shipped.length} shipped${building ? ` · ${building} in development` : ""}`,
      icon: SHIPPED_ICON,
      id: undefined,
    },
    ...rest,
  ];

  return (
    <div data-reveal className="frame mt-10 p-2 sm:p-3">
      <div className="grid overflow-hidden rounded-lg border border-line bg-surface xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        {/* ── story ───────────────────────────────────────────── */}
        <div className="p-6 sm:p-8 xl:p-10">
          <div className="max-w-2xl">
            {story ? (
              <>
                <h2 className={HEADLINE}>
                  {story.lead}{" "}
                  <span className="text-text-3">{story.rest}</span>
                </h2>
                <p className="mt-5 leading-relaxed text-text-2">{story.body}</p>
              </>
            ) : (
              <Fallback bySlug={bySlug} />
            )}
          </div>

          {/* role rows */}
          <ol data-reveal-group className="mt-8 border-t border-line">
            {ROLES.map((r, i) => {
              const doc = r.slug ? bySlug.get(r.slug) : undefined;
              const proof = doc ? `${doc.title} · ${displayClient(doc)}` : r.note;
              const row =
                "flex flex-wrap items-center gap-x-5 gap-y-3 py-4 sm:flex-nowrap";
              const inner = (
                <>
                  <span className="inline-flex shrink-0 items-center rounded-md border border-line bg-surface-2 p-1">
                    {r.tools.map((t, ti) => (
                      <span
                        key={t}
                        title={t}
                        className={`grid size-8 place-items-center rounded-sm border border-line bg-surface ${ti ? "-ml-1.5" : ""}`}
                      >
                        <ToolIcon name={t} size={16} brand />
                        <span className="sr-only">{t}</span>
                      </span>
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-bold tracking-tight text-text transition-colors group-hover:text-accent">
                      {r.title}
                    </span>
                    {proof ? (
                      <span className="mt-0.5 block truncate text-sm text-text-3">
                        {proof}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-mono text-2xs tracking-widest text-text-3">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </>
              );
              return (
                <li key={r.title} className="border-b border-line">
                  {doc ? (
                    <Link href={`/work/${doc.slug}`} className={`group ${row}`}>
                      {inner}
                    </Link>
                  ) : (
                    <div className={row}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="measure mt-3 text-sm text-text-3">
            Nothing here is aspirational. Every tool is in a project I have
            shipped or am building, or in how I work every day.
          </p>

          {/* credential chips */}
          <h3 className="mt-8 font-mono text-2xs uppercase tracking-widest text-text-3">
            Background &amp; credentials
          </h3>
          <ul
            data-reveal-group
            className="mt-3 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2"
          >
            {chips.map((c) => {
              const Icon = c.icon;
              return (
                <li
                  key={c.title}
                  title={c.id ? `Credential ID ${c.id}` : undefined}
                  className="flex items-center gap-3 bg-surface-2 p-4"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-snug text-text">
                      {c.title}
                    </span>
                    <span className="mt-0.5 block font-mono text-2xs uppercase tracking-widest text-text-3">
                      {c.meta}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ── figure ──────────────────────────────────────────── */}
        <div className="relative isolate min-h-112 overflow-hidden border-t border-line bg-surface-2 xl:border-l xl:border-t-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(70%_60%_at_75%_20%,var(--accent-soft),transparent_72%),radial-gradient(55%_45%_at_15%_100%,color-mix(in_oklab,var(--sand)_16%,transparent),transparent_70%)]"
          />
          <AboutScene work={work} />

          <Link
            href="/contact"
            data-magnetic
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface py-2 pl-3 pr-4 text-sm font-semibold text-text shadow-soft transition-colors hover:border-accent"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-ok" />
            {SITE.availability}
          </Link>
        </div>
      </div>
    </div>
  );
}
