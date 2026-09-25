import fs from "node:fs";
import path from "node:path";

/**
 * The portrait in the rail and on the About card.
 *
 * public/avatar.webp is a transparent head-and-shoulders cutout (512×512,
 * metadata stripped) — the rail layers depth onto it (`.portrait` in
 * design/tokens.css). Any avatar.webp / .jpg / .png in public/ is picked up
 * at the next build — no code change.
 * Until then the rail shows the JLR monogram instead of a stock face or an
 * illustration pretending to be one.
 *
 * Server-only: resolved at build time, then passed down as a string. The
 * basePath prefix is added here by hand because a plain <img> — which a
 * static export needs, with image optimisation off — does not get it
 * automatically.
 */

const CANDIDATES = ["avatar.webp", "avatar.jpg", "avatar.jpeg", "avatar.png"];
const DARK = "avatar-dark.webp";

const exists = (file: string) =>
  fs.existsSync(path.join(process.cwd(), "public", file));
const withBase = (file: string) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/${file}`;

export function avatarSrc(): string | null {
  const file = CANDIDATES.find(exists);
  return file ? withBase(file) : null;
}

/**
 * The dark-theme portrait — the same shot in a white hoodie, stacked over
 * avatarSrc() and crossfaded by `.dark` (`.theme-img--*`, design/tokens.css).
 * Both are written by scripts/media/avatar.mjs, which keeps them aligned.
 * Without it the one photo serves both themes.
 */
export function avatarDarkSrc(): string | null {
  return exists(DARK) ? withBase(DARK) : null;
}
