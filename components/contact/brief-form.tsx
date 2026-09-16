"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  BadgeCheck,
  Building2,
  BriefcaseBusiness,
  CalendarClock,
  CalendarRange,
  CircleCheck,
  CircleHelp,
  Clock,
  Copy,
  EyeOff,
  FileText,
  House,
  Lightbulb,
  Mail,
  Minus,
  ScanSearch,
  Send,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT_SENDS, SITE } from "@/lib/site";
import { BRIEF_LIMITS, composeBrief, type Brief, type BriefMode } from "@/lib/brief";
import { Select, type SelectOption } from "@/components/ui/select";

/**
 * The contact form — a project brief, or a job opportunity.
 *
 * Two ways to deliver it, fixed at build time by lib/site.ts:
 *
 *   · Sending (SITE.contactApi and SITE.turnstileSiteKey both set): the brief
 *     is POSTed to the portfolio-contact Worker (workers/contact/), which
 *     stores it and emails it to Jan with Reply-To set to the visitor. A
 *     Cloudflare Turnstile check guards it; its script loads on this page
 *     only, and only in this mode.
 *   · Composing (either unset): the form opens the visitor's own mail app
 *     with the subject and body written, as it always has.
 *
 * When sending fails — the Worker is down, Gmail refused (502), or Turnstile
 * cannot load — the form never says "Sent". It shows the brief ready to go:
 * a mailto link and a copy button, both clicked by the visitor. A mailto
 * opened by script after a slow request (SMTP can take 30s) may be refused by
 * the browser for lacking a recent click, so it is not relied on.
 *
 * Both write the same email (composeBrief, lib/brief.ts). With JavaScript
 * off, `action="mailto:"` still hands the fields to the mail client.
 *
 * The switch at the top changes both the fields and the email's subject,
 * so a recruiter's message and a client's brief never land looking alike.
 */

type Status =
  | "idle"
  | "opened" // composing: the mail app was opened
  | "check" // sending: submitted before the Turnstile check finished
  | "sending"
  | "sent"
  | "fallback" // sending failed; the brief is offered for the mail app
  | "limited"; // the Worker's three-an-hour limit

const SECONDARY =
  "inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-accent";

const FIELD =
  "mt-2 w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-3 transition-colors focus:border-accent";

const LABEL = "block text-sm font-medium text-text";

// The designed dropdowns (components/ui/select.tsx). Values are the labels,
// as they were with the native selects, so the email text is unchanged; ""
// is "nothing chosen" and leaves its line out of the email.
const TIMELINE: SelectOption[] = [
  { value: "", label: "Not sure yet", icon: CircleHelp },
  { value: "As soon as possible", label: "As soon as possible", icon: Zap },
  { value: "In the next 1–3 months", label: "In the next 1–3 months", icon: CalendarClock },
  { value: "Later this year", label: "Later this year", icon: CalendarRange },
];
const BUDGET: SelectOption[] = [
  { value: "", label: "Prefer not to say yet", icon: EyeOff },
  { value: "Budget is approved", label: "Budget is approved", icon: BadgeCheck },
  { value: "Still scoping it", label: "Still scoping it", icon: ScanSearch },
  { value: "Not sure how it would be funded", label: "Not sure how it would be funded", icon: CircleHelp },
];
const TYPE: SelectOption[] = [
  { value: "", label: "Not specified", icon: Minus },
  { value: "Full-time", label: "Full-time", icon: BriefcaseBusiness },
  { value: "Part-time", label: "Part-time", icon: Clock },
  { value: "Contract", label: "Contract", icon: FileText },
];
const SETUP: SelectOption[] = [
  { value: "", label: "Not specified", icon: Minus },
  { value: "Remote", label: "Remote", icon: House },
  { value: "Hybrid", label: "Hybrid", icon: ArrowLeftRight },
  { value: "On-site", label: "On-site", icon: Building2 },
];

/* ── Turnstile ─────────────────────────────────────────────────────── */

type Turnstile = {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

/** Cloudflare's own URL — it must not be proxied or cached (their docs). */
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let turnstileLoading: Promise<Turnstile> | null = null;

function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  turnstileLoading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing"));
    script.onerror = () => reject(new Error("turnstile blocked"));
    document.head.appendChild(script);
  }).catch((err: unknown) => {
    turnstileLoading = null; // let a later mount try again
    throw err;
  });
  return turnstileLoading;
}

/* ── The form ──────────────────────────────────────────────────────── */

function readBrief(form: HTMLFormElement, mode: BriefMode): Brief {
  const d = new FormData(form);
  const v = (key: string) => String(d.get(key) ?? "").trim();
  return {
    mode,
    name: v("name"),
    email: v("email"),
    company: v("company"),
    what: v("what"),
    users: v("users"),
    timeline: v("timeline"),
    budget: v("budget"),
    title: v("title"),
    type: v("type"),
    setup: v("setup"),
    details: v("details"),
  };
}

function mailto(brief: Brief): string {
  const { subject, body } = composeBrief(brief);
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** POST the brief; null when the request itself failed or timed out. */
async function send(brief: Brief, token: string): Promise<Response | null> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 20_000);
  try {
    return await fetch(`${SITE.contactApi}/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...brief, token }),
      signal: abort.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function BriefForm() {
  const [mode, setMode] = useState<BriefMode>("project");
  const [status, setStatus] = useState<Status>("idle");
  const [sentTo, setSentTo] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [turnstileDown, setTurnstileDown] = useState(false);
  // The brief as it was when sending failed — what the fallback link carries.
  const [fallbackBrief, setFallbackBrief] = useState<Brief | null>(null);
  const [copy, setCopy] = useState<"idle" | "done" | "failed">("idle");

  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const done = useRef<HTMLDivElement>(null);

  const sent = status === "sent";

  // The Turnstile widget: sending mode only, and only while the form shows.
  useEffect(() => {
    if (!CONTACT_SENDS || sent) return;
    let cancelled = false;

    loadTurnstile()
      .then((ts) => {
        if (cancelled || !widget.current) return;
        widgetId.current = ts.render(widget.current, {
          sitekey: SITE.turnstileSiteKey,
          action: "contact",
          size: "flexible",
          theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
          callback: (t: string) => {
            setToken(t);
            setStatus((s) => (s === "check" ? "idle" : s));
          },
          "expired-callback": () => setToken(null),
          "error-callback": () => setToken(null),
        });
      })
      .catch(() => {
        if (!cancelled) setTurnstileDown(true);
      });

    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
      setToken(null);
    };
  }, [sent]);

  // Move focus to the confirmation, so it is announced and Tab starts there.
  useEffect(() => {
    if (sent) done.current?.focus();
  }, [sent]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    const brief = readBrief(e.currentTarget, mode);
    setFallbackBrief(null);
    setCopy("idle");

    if (!CONTACT_SENDS) {
      window.location.href = mailto(brief);
      setStatus("opened");
      return;
    }

    if (!token) {
      if (turnstileDown) {
        // Still inside the click, so opening the mail app is allowed here.
        window.location.href = mailto(brief);
        setFallbackBrief(brief);
        setStatus("fallback");
      } else {
        setStatus("check");
      }
      return;
    }

    setStatus("sending");
    const res = await send(brief, token);

    if (res?.ok) {
      setSentTo(brief.email);
      setStatus("sent");
      return;
    }

    // A token is good for one verification, spent or not.
    setToken(null);
    if (widgetId.current) window.turnstile?.reset(widgetId.current);

    if (res?.status === 429) {
      setStatus("limited");
      return;
    }
    setFallbackBrief(brief);
    setStatus("fallback");
  }

  async function copyBrief() {
    if (!fallbackBrief) return;
    const { subject, body } = composeBrief(fallbackBrief);
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopy("done");
    } catch {
      setCopy("failed");
    }
  }

  if (sent) {
    return (
      <div ref={done} tabIndex={-1} role="status" className="focus:outline-none">
        <CircleCheck size={22} strokeWidth={1.75} aria-hidden="true" className="text-accent" />
        <p className="mt-3 font-display text-xl font-semibold tracking-tight text-text">
          Sent. Thank you.
        </p>
        <p className="mt-2 text-sm text-text-2">
          It reached me. The reply will come to{" "}
          <span className="font-medium text-text">{sentTo}</span>.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className={cn(SECONDARY, "mt-6")}
        >
          Write another
        </button>
      </div>
    );
  }

  const note = !CONTACT_SENDS
    ? status === "opened"
      ? "Your mail app should have opened with this filled in. Nothing was sent yet — press send there."
      : "Opens your own mail app with this filled in. Nothing is sent from this page."
    : {
        idle: turnstileDown
          ? "The verification check didn't load, so sending will open your mail app instead."
          : "Goes straight to my inbox and is kept at most 90 days. Your email is used only to reply.",
        opened: "",
        check: "Finish the verification check above, then send.",
        sending: "Sending…",
        sent: "",
        fallback: {
          idle: "It didn't go through from here. Your brief is ready to send from your own mail app.",
          done: `Copied — paste it into an email to ${SITE.email}.`,
          failed: `Couldn't copy it here. Open it in your mail app, or email ${SITE.email}.`,
        }[copy],
        limited: `That's the limit for now. Try again in an hour, or email ${SITE.email}.`,
      }[status];

  return (
    <form
      action={`mailto:${SITE.email}`}
      method="post"
      encType="text/plain"
      onSubmit={onSubmit}
      // Base grid-cols, not only sm: — a breakpoint-only grid-cols leaves an
      // implicit `auto` track below it that can exceed its container. Here it
      // ran 30px past the card at 360 (R15).
      className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2"
    >
      {/* Mode switch — native radios, so it is keyboard-operable for free */}
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium text-text">
          What is this about?
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              { v: "project", label: "A project", icon: Lightbulb },
              { v: "role", label: "A job opportunity", icon: BriefcaseBusiness },
            ] as const
          ).map((o) => {
            const Icon = o.icon;
            const active = mode === o.v;
            return (
              <label
                key={o.v}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md border px-4 py-3 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                  active
                    ? "border-accent bg-accent-soft text-text"
                    : "border-line bg-surface text-text-2 hover:border-accent",
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  value={o.v}
                  checked={active}
                  onChange={() => {
                    setMode(o.v);
                    setStatus("idle");
                  }}
                  className="sr-only"
                />
                <Icon
                  size={16}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className={active ? "text-accent" : "text-text-3"}
                />
                {o.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className={LABEL}>
        Your name
        <input
          name="name"
          required
          autoComplete="name"
          maxLength={BRIEF_LIMITS.name}
          className={FIELD}
        />
      </label>

      {/* Sending needs an address to reply to; a mail app already has one. */}
      {CONTACT_SENDS ? (
        <label className={LABEL}>
          Your email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={BRIEF_LIMITS.email}
            className={FIELD}
          />
        </label>
      ) : null}

      <label className={cn(LABEL, CONTACT_SENDS && "sm:col-span-2")}>
        {mode === "project" ? "Company or organisation" : "Company"}
        <input
          name="company"
          required={mode === "role"}
          autoComplete="organization"
          maxLength={BRIEF_LIMITS.company}
          className={FIELD}
        />
      </label>

      {mode === "project" ? (
        <>
          <label className={cn(LABEL, "sm:col-span-2")}>
            What do you want built?
            <textarea
              name="what"
              required
              rows={4}
              maxLength={BRIEF_LIMITS.text}
              placeholder="The problem, not the solution — what is slow, manual or missing today."
              className={FIELD}
            />
          </label>

          <label className={cn(LABEL, "sm:col-span-2")}>
            Who will use it?
            <input
              name="users"
              maxLength={BRIEF_LIMITS.users}
              placeholder="Your team, your customers, the public…"
              className={FIELD}
            />
          </label>

          <Select name="timeline" label="Timeline" options={TIMELINE} />

          <Select name="budget" label="Budget" options={BUDGET} />
        </>
      ) : (
        <>
          <label className={cn(LABEL, "sm:col-span-2")}>
            Role title
            <input
              name="title"
              required
              maxLength={BRIEF_LIMITS.title}
              placeholder="e.g. Full-stack developer"
              className={FIELD}
            />
          </label>

          <Select name="type" label="Type" options={TYPE} />

          <Select name="setup" label="Work setup" options={SETUP} />

          <label className={cn(LABEL, "sm:col-span-2")}>
            Details
            <textarea
              name="details"
              rows={4}
              maxLength={BRIEF_LIMITS.text}
              placeholder="A link to the posting, the team, the stack — whatever helps."
              className={FIELD}
            />
          </label>
        </>
      )}

      {/* Turnstile draws its check here. The height is held so the button
          does not jump when it appears. */}
      {CONTACT_SENDS && !turnstileDown ? (
        <div ref={widget} className="min-h-16 sm:col-span-2" />
      ) : null}

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex items-center gap-2 rounded-full bg-accent py-2.5 pl-5 pr-4 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
        >
          {CONTACT_SENDS ? (status === "sending" ? "Sending…" : "Send") : "Write the email"}
          <Send
            size={15}
            strokeWidth={2}
            aria-hidden="true"
            className="transition-transform duration-300 ease-(--ease-out) group-hover:translate-x-0.5"
          />
        </button>

        <p aria-live="polite" className="text-sm text-text-3">
          {note}
        </p>
      </div>

      {/* Sending failed: the visitor's own click opens the mail app. */}
      {status === "fallback" && fallbackBrief ? (
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <a href={mailto(fallbackBrief)} className={SECONDARY}>
            <Mail size={15} strokeWidth={2} aria-hidden="true" />
            Open in your mail app
          </a>
          <button type="button" onClick={copyBrief} className={SECONDARY}>
            <Copy size={15} strokeWidth={2} aria-hidden="true" />
            Copy the brief
          </button>
        </div>
      ) : null}
    </form>
  );
}
