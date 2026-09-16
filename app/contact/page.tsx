import type { Metadata } from "next";
import { ArrowUpRight, Mail } from "lucide-react";
import { CONTACT_SENDS, SITE } from "@/lib/site";
import { SOCIALS } from "@/lib/socials";
import { BrandIcon } from "@/components/icons/brand";
import { BriefForm } from "@/components/contact/brief-form";
import { DotPattern } from "@/components/ui/dot-pattern";
import { BookCall } from "@/components/site/book-call";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a project, or talk to me about a role.",
};

/**
 * Contact.
 *
 * Three ways in: email (the address is the guarantee — it works on a
 * locked-down desktop with scripts blocked), the brief form (switches between
 * a project brief and a job opportunity; sends through the portfolio-contact
 * Worker once it is configured, otherwise composes an email in the visitor's
 * own client — components/contact/brief-form.tsx), and the four profiles. A
 * fourth, "Book a 30-min call", appears beside the email button once
 * SITE.bookingUrl is set.
 */

export default function Contact() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <DotPattern id="contact-dots" />

        <p className="font-mono text-2xs uppercase tracking-widest text-text-3">
          Contact
        </p>

        <h1 data-split className="mt-6 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Tell me what you want built.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-text-2">
          No deck needed. A few sentences on the problem, who will use it and
          when you need it is enough to start. Hiring instead? The form below
          has a switch for that.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href={`mailto:${SITE.email}`}
            className="group inline-flex items-center gap-2 rounded-full bg-accent py-2.5 pl-4 pr-5 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
          >
            <Mail size={16} strokeWidth={2} aria-hidden="true" />
            Email me
          </a>
          <BookCall className="py-2.5" />
          <a
            href={`mailto:${SITE.email}`}
            className="font-display text-xl font-semibold tracking-tight text-text transition-colors hover:text-accent"
          >
            {SITE.email}
          </a>
        </div>

        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          <span className="font-mono text-2xs uppercase tracking-widest text-text-2">
            {SITE.availability}
          </span>
        </p>
      </section>

      <section className="border-b border-line px-5 py-14 sm:px-8 lg:px-12">
        {/* `grid-cols-[minmax(0,1fr)]` at every width, not only from lg. A
            bare single-column grid gets an implicit `auto` track, which is
            allowed to grow past its container and refuses to shrink below its
            items' min-content: at 360px it resolved to 350px inside a 320px
            box, pushing the whole page 10px sideways. The lg rule already
            guards against this with minmax(0,…) — the mobile case just never
            got the same treatment. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
          <div data-reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Send a brief
            </h2>
            <p className="mt-2 max-w-xl text-sm text-text-2">
              {CONTACT_SENDS
                ? "A few questions, for a project or a job opportunity. It comes straight to my inbox, and the reply goes to the email you give."
                : "A few questions, for a project or a job opportunity. The answers become an email in your own mail app — you read it before anything is sent."}
            </p>

            <div className="mt-8 rounded-md border border-glass-line bg-glass p-6 backdrop-blur-xl sm:p-8">
              <BriefForm />
            </div>
          </div>

          <aside data-reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Or find me here
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {SOCIALS.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-spotlight
                    className="group flex items-center gap-4 rounded-md border border-glass-line bg-glass p-4 backdrop-blur-xl transition-colors hover:border-accent"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-md border border-glass-line bg-accent-soft text-accent">
                      <BrandIcon id={s.id} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-text">
                        {s.label}
                      </span>
                      <span className="block truncate font-mono text-2xs text-text-3">
                        {s.handle}
                      </span>
                      <span className="mt-1 block text-xs text-text-2">
                        {s.note}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={16}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="shrink-0 text-text-3 transition-all duration-300 ease-(--ease-out) group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
