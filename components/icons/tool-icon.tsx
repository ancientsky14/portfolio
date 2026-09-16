import type { CSSProperties } from "react";
import {
  SiClaude,
  SiClaudeHex,
  SiCloudflareworkers,
  SiCloudflareworkersHex,
  SiDocker,
  SiDockerHex,
  SiGoogle,
  SiGoogleHex,
  SiGreensock,
  SiGreensockHex,
  SiHostinger,
  SiHostingerHex,
  SiN8n,
  SiN8nHex,
  SiNextdotjs,
  SiNextdotjsHex,
  SiPocketbase,
  SiPocketbaseHex,
  SiPostgresql,
  SiPostgresqlHex,
  SiRailway,
  SiRailwayHex,
  SiReact,
  SiReactHex,
  SiRender,
  SiRenderHex,
  SiRust,
  SiRustHex,
  SiSqlite,
  SiSqliteHex,
  SiSupabase,
  SiSupabaseHex,
  SiTailwindcss,
  SiTailwindcssHex,
  SiTauri,
  SiTauriHex,
  SiThreedotjs,
  SiThreedotjsHex,
  SiTypescript,
  SiTypescriptHex,
  SiVercel,
  SiVercelHex,
  SiVite,
  SiViteHex,
} from "@icons-pack/react-simple-icons";
import {
  Bot,
  SquareCode,
  Terminal,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

/**
 * Marks for the tools lists. Keyed by the exact `name` in lib/stack.ts.
 *
 * Two looks:
 *   · default — `currentColor`, one accent (the About chips).
 *   · `brand` — each tool in its own colours (the home marquee only, Jan's
 *     request on 2026-09-11; an exception to rule 1, noted in tokens.css).
 *
 * Brand colours come from Simple Icons (`Si*Hex`). Tools Simple Icons has no
 * mark for — its Microsoft and OpenAI marks were withdrawn, its "Hermes" is
 * the fashion house, and its Google mark is single-colour — use official
 * colour SVGs in public/icons/tools/ (devicon and lobehub icons, both MIT).
 * `nous-research.svg` is re-minified locally, not the pristine upstream file:
 * it shipped at 19.8 KB, 5.8× the next mark, for something drawn at 18 px.
 * SVGO at precision 2 halved it with SSIM 0.997 against the original at every
 * size it is used. Precision 1 reached 3.5 KB but SSIM 0.93 — visibly
 * polygonal when enlarged — so it was not taken (R14).
 * Near-black brands fall back to the text colour on the dark theme, and the
 * one monochrome file is inverted there, so no mark vanishes.
 */

type SiIcon = typeof SiReact;

const MAP: Record<string, [SiIcon, string]> = {
  "Next.js": [SiNextdotjs, SiNextdotjsHex],
  React: [SiReact, SiReactHex],
  TypeScript: [SiTypescript, SiTypescriptHex],
  Tauri: [SiTauri, SiTauriHex],
  Rust: [SiRust, SiRustHex],
  Supabase: [SiSupabase, SiSupabaseHex],
  PostgreSQL: [SiPostgresql, SiPostgresqlHex],
  SQLite: [SiSqlite, SiSqliteHex],
  PocketBase: [SiPocketbase, SiPocketbaseHex],
  Vite: [SiVite, SiViteHex],
  Docker: [SiDocker, SiDockerHex],
  "Cloudflare Workers": [SiCloudflareworkers, SiCloudflareworkersHex],
  "Tailwind CSS": [SiTailwindcss, SiTailwindcssHex],
  GSAP: [SiGreensock, SiGreensockHex],
  "Three.js": [SiThreedotjs, SiThreedotjsHex],
  "Claude Code": [SiClaude, SiClaudeHex],
  n8n: [SiN8n, SiN8nHex],
  "Google Workspace": [SiGoogle, SiGoogleHex],
  Vercel: [SiVercel, SiVercelHex],
  Render: [SiRender, SiRenderHex],
  Railway: [SiRailway, SiRailwayHex],
  "Hostinger VPS": [SiHostinger, SiHostingerHex],
};

/** Plain UI icons for the tools with no mark in Simple Icons (default look). */
const UI: Record<string, LucideIcon> = {
  "VS Code": SquareCode,
  Codex: Terminal,
  "Hermes AI": Bot,
};

/** Official colour marks, for the brand look. `mono` = single-colour file. */
const FILES: Record<string, { file: string; mono?: boolean }> = {
  "VS Code": { file: "vscode.svg" },
  "Claude Code": { file: "claude-code.svg" },
  Codex: { file: "codex.svg" },
  "Hermes AI": { file: "nous-research.svg", mono: true },
  "Google Workspace": { file: "google.svg" },
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** True for near-black brand colours, which would vanish on the dark theme. */
function isDark(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.06;
}

export function ToolIcon({
  name,
  size = 14,
  brand = false,
}: {
  name: string;
  size?: number;
  brand?: boolean;
}) {
  if (name === "Offline-first sync") {
    return <WifiOff size={size} strokeWidth={1.75} aria-hidden="true" />;
  }

  if (brand) {
    const f = FILES[name];
    if (f) {
      return (
        // A plain <img>: a static export ships with image optimisation off.
        //
        // Not `loading="lazy"` — tried and reverted 2026-09-16 (R13). React 19
        // preloads server-rendered images, which puts five `<link rel=preload
        // as=image>` for these marks in the home page's head (27 KB, 20 of it
        // one unoptimised SVG), and lazy images are not preloaded. It worked:
        // preloads went 6 → 1. It bought nothing: LCP median 1400 → 1420 ms
        // over 5 runs each, ranges overlapping — this page's LCP equals its
        // FCP, so it is gated by HTML, CSS and CPU, not by image bandwidth.
        // And the marquee scrolls horizontally, so its off-screen marks would
        // have popped in mid-animation. Shrinking nous-research.svg is the
        // change that would actually pay.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${BASE}/icons/tools/${f.file}`}
          alt=""
          width={size}
          height={size}
          className={f.mono ? "tool-mark tool-mark--mono" : "tool-mark"}
        />
      );
    }
    const m = MAP[name];
    if (m) {
      const [Icon, hex] = m;
      return (
        <span
          className={isDark(hex) ? "tool-brand tool-brand--dark" : "tool-brand"}
          style={{ "--brand": hex } as CSSProperties}
        >
          <Icon size={size} color="currentColor" aria-hidden="true" />
        </span>
      );
    }
    return null;
  }

  const Ui = UI[name];
  if (Ui) return <Ui size={size} strokeWidth={1.75} aria-hidden="true" />;

  const m = MAP[name];
  if (!m) return null;
  const [Icon] = m;
  return <Icon size={size} color="currentColor" aria-hidden="true" />;
}