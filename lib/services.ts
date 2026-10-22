import {
  ClipboardList,
  CodeXml,
  Hammer,
  Layers,
  LifeBuoy,
  MessagesSquare,
  MonitorSmartphone,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * What I build and how I work — the content of /services, and the list on
 * the home bento's Services card.
 *
 * Every line here is a claim made to a client, so each carries its receipt
 * (`receipt`, not rendered): a case study in content/work/, or a step Jan
 * confirmed in lib/engagement.ts. Nothing is here because it reads well.
 */

export type MethodStep = {
  n: string;
  title: string;
  icon: LucideIcon;
  line: string;
  chips: string[];
  receipt: string;
};

/** Scope. Build. Keep running. — the three phases, before the five detailed
 *  steps further down the page. */
export const METHOD: MethodStep[] = [
  {
    n: "01",
    title: "Scope.",
    icon: MessagesSquare,
    line: "A fixed scope and price, agreed before any code is written.",
    chips: ["Fixed scope", "Clear price", "Sign-off"],
    receipt: "lib/engagement.ts step 1, confirmed by Jan 2026-09-11",
  },
  {
    n: "02",
    title: "Build.",
    icon: Hammer,
    line: "A staging link from the first week, so you watch it get built.",
    chips: ["Staging link", "Early feedback", "Signed release"],
    receipt: "step 2; signed releases — eBudget",
  },
  {
    n: "03",
    title: "Keep running.",
    icon: LifeBuoy,
    line: "Training for the people who use it, and I stay on for the updates.",
    chips: ["Training", "Written docs", "Updates"],
    receipt: "steps 3–4; maintenance is in every case study's role line",
  },
];

export type Service = {
  /** Short name — the home bento's list. */
  name: string;
  title: string;
  icon: LucideIcon;
  /** Names from lib/stack.ts, drawn by ToolIcon. */
  tools: string[];
  line: string;
  badge: string;
  checks: string[];
  href?: string;
  receipt: string;
};

export const SERVICES: Service[] = [
  {
    name: "Web apps & platforms",
    title: "Web apps & platforms",
    icon: CodeXml,
    tools: ["Next.js", "React", "Supabase"],
    line: "A public site and the tools behind it.",
    badge: "One data model",
    checks: [
      "Public portal and role-based CMS",
      "Staff intranet on its own deploy",
      "One side can't take the other down",
    ],
    href: "/work/santol-lmis",
    receipt: "LMIS case study",
  },
  {
    name: "Desktop apps",
    title: "Desktop apps",
    icon: MonitorSmartphone,
    tools: ["Tauri", "Rust", "React"],
    line: "Installed, shared, and self-updating.",
    badge: "Updates itself",
    checks: [
      "One installer, no browser",
      "Several desks, one database",
      "Signed releases",
    ],
    href: "/work/mgb-ebudget",
    receipt: "eBudget case study (CONFIRMED block)",
  },
  {
    name: "Multi-site systems",
    title: "Multi-site platforms",
    icon: Layers,
    tools: ["React", "PocketBase", "Docker"],
    line: "One platform, many sites.",
    badge: "Built in the open",
    checks: [
      "Each site sees only its own records",
      "Isolation enforced on the server",
      "Open source, in development",
    ],
    href: "/work/sentro",
    receipt: "SENTRO case study — MIT, status in development",
  },
  {
    name: "Internal tools & dashboards",
    title: "Internal tools",
    icon: ClipboardList,
    tools: ["Next.js", "Supabase", "Docker"],
    line: "Know where everything is.",
    badge: "Full audit trail",
    checks: [
      "Row-level security",
      "Bot protection",
      "Shipped as a container",
    ],
    href: "/work/mgb-region-1-etracker",
    receipt: "MGBR1-FIRMS case study",
  },
  {
    name: "Maintenance & updates",
    title: "Maintenance & updates",
    icon: Wrench,
    tools: ["Cloudflare Workers", "Vercel", "Hostinger VPS"],
    line: "The part after launch.",
    badge: "Stays running",
    checks: [
      "Updates after launch",
      "Backups and audit logs",
      "Training and written docs",
    ],
    receipt: "maintenance in every role; eBudget backups + audit log; step 4",
  },
];
