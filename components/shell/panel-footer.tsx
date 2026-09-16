import { SITE } from "@/lib/site";
import { SocialLinks } from "./social-links";

/**
 * The panel's footer.
 *
 * Deliberately thin. On desktop the rail already carries the name, the role
 * line, the availability state, the socials and the copyright, so repeating
 * all of it here would be the third copy on screen. What the footer owes the
 * reader is the one thing the rail cannot guarantee: a plain, selectable
 * email address that works with JavaScript off.
 *
 * No nav links (removed 2026-09-16, Jan's call): the rail from lg up and the
 * tab bar below it are both permanently on screen, so a footer list was a
 * second copy of the same NAV. Don't add one back.
 */

export function PanelFooter() {
  return (
    // `.panel-footer` is hidden on the fitted home page (design/tokens.css),
    // where the rail's copyright stands in for it.
    <footer className="panel-footer border-t border-line px-5 py-10 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-2xs uppercase tracking-widest text-text-3">
            Start a project
          </p>
          <a
            href={`mailto:${SITE.email}`}
            className="mt-2 block font-display text-xl font-semibold tracking-tight text-text transition-colors hover:text-accent"
          >
            {SITE.email}
          </a>
          <p className="mt-2 text-sm text-text-2">
            Or use the form on the contact page. Both reach the same inbox.
          </p>
        </div>

        <div className="lg:text-right">
          <SocialLinks className="lg:justify-end" />

          <p className="mt-5 font-mono text-2xs uppercase tracking-widest text-text-3">
            © {new Date().getFullYear()} {SITE.name} · Built in the Philippines
          </p>
          {/* Design credit — plain text, never a link (lib/site.ts). */}
          <p className="mt-2 font-mono text-2xs uppercase tracking-widest text-text-3">
            {SITE.credit}
          </p>
        </div>
      </div>
    </footer>
  );
}
