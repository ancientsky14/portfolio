import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  CodeXml,
  Handshake,
  Layers,
  MonitorSmartphone,
  RefreshCw,
  Rocket,
  Scale,
  ShieldCheck,
  UserRound,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { getAllWork, displayClient } from "@/lib/content";
import { STEPS } from "@/lib/engagement";
import { confirmedCredentials } from "@/lib/about";
import { SERVICES } from "@/lib/services";

/**
 * The showcase bento — one soft frame holding six cards on a four-column
 * grid, each with a solid icon tile, an uppercase title, a line of
 * description and a real visual.
 *
 *   Work       the four products, in a window mock
 *   About      the confirmed credentials from lib/about.ts
 *   Shipped    each product with its status and version, from frontmatter
 *   Updates    "I stay on after launch" — step 4 in lib/engagement.ts
 *   Services   what I build, as a numbered list
 *   Built for  the client cards, named only once cleared (displayClient)
 *
 * Positioned for a product developer, not a government niche: every card
 * leads with what was built. Status, platform and version come straight
 * from content/work/*.mdx, so a card can never claim more than the case
 * study behind it.
 */


const PLATFORM_ICON: Record<string, LucideIcon> = {
  Desktop: MonitorSmartphone,
  Web: CodeXml,
  Platform: Layers,
};

function Card({
  href,
  icon: Icon,
  title,
  blurb,
  className,
  row = false,
  children,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  blurb: string;
  className?: string;
  /** Wide cards: head and text left, media right, in the fitted grid. */
  row?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className={className}>
      <Link
        href={href}
        data-spotlight
        data-tilt-card
        className={`home-fit__card${row ? " home-fit__card--row" : ""} group flex h-full flex-col rounded-lg border border-line bg-surface p-5 shadow-soft transition-colors hover:border-accent sm:p-6`}
      >
        <div className="home-fit__card-head flex items-center gap-3">
          <span data-tilt-icon className="home-fit__card-icon grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-ink">
            <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <h3 className="home-fit__card-title font-display text-base font-bold uppercase tracking-wider text-text transition-colors group-hover:text-accent">
            {title}
          </h3>
        </div>
        <p className="home-fit__card-desc measure mt-3 text-sm leading-relaxed text-text-2">
          {blurb}
        </p>
        {children ? (
          <div className="home-fit__card-media mt-4 flex-1">{children}</div>
        ) : null}
      </Link>
    </li>
  );
}

export function Bento() {
  const work = getAllWork();
  const clients = work.filter((w) => w.client !== "Own product");
  const updates = STEPS.find((s) => s.n === 4 && s.confirmed);

  return (
    <section
      data-intro="rise"
      className="home-fit__show px-5 pb-14 sm:px-8 lg:px-12"
    >
      <h2 className="sr-only">Explore</h2>

      <div className="frame p-3 sm:p-4">
        <ul
          data-reveal-group
          // 2 columns here; the switch to 4 happens at 1100px in
          // `.home-fit__grid` (design/tokens.css), where the home becomes
          // the fitted grid. A Tailwind `min-[1100px]:grid-cols-4` lost to
          // `md:grid-cols-2` in the cascade — see the note there.
          className="home-fit__grid grid gap-3 sm:gap-4 md:grid-cols-2"
        >
          {/* WORK — window mock of the products */}
          <Card
            href="/work"
            icon={BriefcaseBusiness}
            title="Work"
            blurb="A desktop app, two web platforms and an open-source platform — each built end to end."
            className="md:col-span-2"
            row
          >
            <div className="home-fit__mock rounded-md border border-line bg-surface-2 p-2 shadow-soft">
              <div aria-hidden="true" className="flex gap-1.5 px-1 pb-2">
                <span className="size-2 rounded-full bg-line-2" />
                <span className="size-2 rounded-full bg-line-2" />
                <span className="size-2 rounded-full bg-line-2" />
              </div>
              <div className="rounded-sm bg-text px-5 py-4 text-ground">
                <ul className="flex flex-col gap-2.5">
                  {work.map((w) => {
                    const Icon = w.platform ? PLATFORM_ICON[w.platform] : null;
                    return (
                      <li
                        key={w.slug}
                        className="flex items-baseline justify-between gap-4"
                      >
                        <span className="font-display text-xl font-semibold tracking-tight">
                          {w.title}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-mono text-2xs uppercase tracking-widest opacity-70">
                          {Icon ? (
                            <Icon size={12} strokeWidth={1.75} aria-hidden="true" />
                          ) : null}
                          {w.platform}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </Card>

          {/* ABOUT — the confirmed credentials (lib/about.ts). Not the
              portrait: the rail carries that a few hundred pixels away, and
              a second copy said nothing new (Jan, 2026-09-12). */}
          <Card
            href="/about"
            icon={UserRound}
            title="About"
            blurb="Who I am, how I work, and what I'm open to."
          >
            {/* Titles only: the card is one column wide, and the issuer and
                date (c.meta) do not fit beside them. They stay as the row's
                tooltip, and /about carries them in full. */}
            {/* data-fit: how many rows survive on the fitted home, where a
                card has ~80px for them (design/tokens.css, R10). */}
            <ul data-fit="2" className="home-fit__list flex flex-col gap-1.5">
              {confirmedCredentials()
                .slice(0, 3)
                .map((c) => {
                  const Icon = c.icon;
                  return (
                    <li
                      key={c.title}
                      title={`${c.title} — ${c.meta}`}
                      className="flex items-start gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold leading-tight text-text"
                    >
                      <Icon
                        size={13}
                        strokeWidth={1.75}
                        aria-hidden="true"
                        className="mt-px shrink-0 text-accent"
                      />
                      <span className="min-w-0">{c.title}</span>
                    </li>
                  );
                })}
            </ul>
          </Card>

          {/* SHIPPED — status and version, from frontmatter */}
          <Card
            href="/work"
            icon={Rocket}
            title="Shipped"
            blurb="Where each one stands today."
          >
            <ul data-fit="3" className="home-fit__list flex flex-col gap-2">
              {work.map((w) => {
                const live = w.status ? !/develop|testing/i.test(w.status) : false;
                return (
                  <li
                    key={w.slug}
                    className="flex items-center justify-between gap-3 rounded-full border border-line bg-surface py-1.5 pl-3.5 pr-3 text-sm font-semibold text-text"
                  >
                    {w.title}
                    <span className="flex items-center gap-1.5 text-xs font-medium text-text-3">
                      {w.version ? `v${w.version}` : w.status}
                      <span
                        aria-hidden="true"
                        title={w.status}
                        className={
                          live
                            ? "size-2 rounded-full bg-ok"
                            : "size-2 rounded-full bg-line-2"
                        }
                      />
                      <span className="sr-only">{w.status}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* UPDATES — "I stay on after launch" (step 4, lib/engagement.ts),
              as a medal. Falls back to the open-source card if that step is
              ever un-confirmed. No ownership terms (Jan, 2026-09-11). */}
          {updates ? (
            <Card
              href="/services"
              icon={RefreshCw}
              title="Updates"
              blurb="I stay on after launch: fixes, updates and new features."
            >
              <div aria-hidden="true" className="home-fit__medal mt-2 flex flex-col items-center">
                <span className="grid size-24 place-items-center rounded-full border border-line bg-surface shadow-soft">
                  <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
                    <RefreshCw size={28} strokeWidth={1.75} />
                  </span>
                </span>
                <span className="-mt-3 flex items-center gap-1.5 rounded-full bg-text px-3 py-1 text-xs font-semibold text-ground">
                  <ShieldCheck size={13} strokeWidth={2} />
                  Signed auto-updates
                </span>
              </div>
            </Card>
          ) : (
            <Card
              href="/work/sentro"
              icon={Scale}
              title="Open source"
              blurb="SENTRO is MIT-licensed and built in the open."
            />
          )}

          {/* SERVICES — numbered list */}
          <Card
            href="/services"
            icon={WifiOff}
            title="Services"
            blurb="What I build, from first sketch to signed release."
          >
            <ol className="home-fit__rows divide-y divide-line border-y border-line">
              {SERVICES.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li
                    key={s.name}
                    className="flex items-center gap-2.5 py-1.5 text-sm font-semibold text-text"
                  >
                    <Icon
                      size={14}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="text-accent"
                    />
                    <span className="flex-1">{s.name}</span>
                    <span className="font-mono text-2xs tabular-nums text-text-3">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>

          {/* BUILT FOR — client cards */}
          <Card
            href="/work"
            icon={Handshake}
            title="Built for"
            blurb="Teams running these today, named with their permission."
            className="md:col-span-2"
            row
          >
            <ul className="home-fit__clients grid gap-3 sm:grid-cols-2">
              {clients.map((w) => (
                <li
                  key={w.slug}
                  className="rounded-md border border-line bg-surface p-4 shadow-soft"
                >
                  <p className="flex items-center gap-2 text-sm font-bold text-text">
                    <Building2
                      size={15}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="text-accent"
                    />
                    {w.title}
                  </p>
                  <p className="mt-1 text-sm text-text-2">{displayClient(w)}</p>
                  {w.stack?.length ? (
                    <p className="mt-1.5 text-xs font-semibold text-accent">
                      {w.stack.slice(0, 3).join(" · ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        </ul>
      </div>
    </section>
  );
}
