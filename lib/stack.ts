/**
 * Tools, in two lists.
 *
 * TOOLS — the stack. Every entry actually appears in a shipped system's
 * `stack` in content/work/*.mdx, or in this repo's own package.json. The
 * About page lists all of it. A buyer who spots one tool you cannot discuss
 * on a call discounts the rest, so it stays short and true.
 *
 * WORKFLOW — what Jan works in every day: editor, AI coding agents,
 * automation. Not part of a shipped stack, so the receipt is Jan's word.
 *
 * MARQUEE — the home page's tools row, chosen by Jan on 2026-09-11: his
 * workflow first, then the stack without the languages and libraries he left
 * off the row (TypeScript, Rust, Vite, PocketBase, GSAP, Three.js), then
 * HOSTING — where he deploys.
 *
 * `where` is not rendered. It is the receipt: why this entry is allowed to
 * be on the list.
 */

export type Tool = { name: string; where: string };

// Receipts re-checked 2026-09-10 against the sibling repos in
// D:\Dev\AI\Projects (package.json / README of each).
export const TOOLS: Tool[] = [
  { name: "TypeScript", where: "every project" },
  { name: "React", where: "eBudget, SENTRO, LMIS, MGBR1-FIRMS, this site" },
  { name: "Next.js", where: "LMIS, MGBR1-FIRMS, this site" },
  { name: "Tauri", where: "eBudget" },
  { name: "Rust", where: "eBudget" },
  { name: "Supabase", where: "LMIS, MGBR1-FIRMS, eBudget" },
  { name: "PostgreSQL", where: "LMIS, MGBR1-FIRMS, eBudget" },
  { name: "SQLite", where: "eBudget" },
  { name: "PocketBase", where: "SENTRO" },
  { name: "Vite", where: "eBudget, SENTRO" },
  { name: "Docker", where: "MGBR1-FIRMS, SENTRO" },
  { name: "Cloudflare Workers", where: "LMIS" },
  { name: "Tailwind CSS", where: "eBudget, SENTRO, MGBR1-FIRMS, this site" },
  { name: "GSAP", where: "this site" },
  { name: "Three.js", where: "this site" },
];

export const WORKFLOW: Tool[] = [
  { name: "VS Code", where: "Jan, 2026-09-11 — daily editor" },
  { name: "Claude Code", where: "Jan, 2026-09-11 — AI coding agent" },
  { name: "Codex", where: "Jan, 2026-09-11 — AI coding agent" },
  { name: "Hermes AI", where: "Jan, 2026-09-11" },
  { name: "n8n", where: "Jan, 2026-09-11 — automation" },
  { name: "Google Workspace", where: "Jan, 2026-09-11" },
];

export const HOSTING: Tool[] = [
  { name: "Vercel", where: "LMIS, before its move to Cloudflare Workers" },
  { name: "Render", where: "Jan, 2026-09-11" },
  { name: "Railway", where: "Jan, 2026-09-11" },
  { name: "Hostinger VPS", where: "Jan, 2026-09-11" },
];

const OFF_MARQUEE = new Set([
  "TypeScript",
  "Rust",
  "Vite",
  "PocketBase",
  "GSAP",
  "Three.js",
]);

export const MARQUEE: Tool[] = [
  ...WORKFLOW,
  ...TOOLS.filter((t) => !OFF_MARQUEE.has(t.name)),
  ...HOSTING,
];
