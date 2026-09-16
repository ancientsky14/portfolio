/**
 * eTracker (MGBR1 Disbursement Tracking System) — screenshots and a screen
 * recording for /work/mgb-region-1-etracker, from the LIVE system, on Jan's
 * instruction (2026-09-11), with Jan signing in himself.
 *
 * This is a finance office's system: its tables hold real payees, claims and
 * amounts, some of them individual employees. So, beyond the LMIS rules
 * (scripts/capture/lmis-prod.mjs):
 *
 *   · Read-only. Navigation only — no fills, submits, saves or deletes.
 *   · Jan signs in (and solves the bot check) in a visible, NOT-recorded
 *     window. Credentials never reach a recording, a log or this script.
 *   · A fixed page allowlist. Admin (users, employees, recovery, deployment,
 *     email templates), profile and payee bank accounts are never opened.
 *   · Every table row is blurred before capture — headers, layout and
 *     summary cards stay readable, no payee or amount row does. On top of
 *     that, the LMIS repo's MASK_FN blurs emails, phone numbers and nearby
 *     names anywhere on the page.
 *   · Jan reviews every file before it ships; anything that still shows a
 *     person's details is deleted, not published.
 *
 *   node scripts/capture/etracker-prod.mjs
 */

import { chromium } from "playwright";
import path from "node:path";
import {
  VIEWPORT,
  VIDEO_SIZE,
  assertLocal,
  outDir,
  tmpVideoDir,
  tourScroll,
  shot,
  saveVideo,
  settle,
  sleep,
} from "./lib.mjs";

const PROD = "https://mgbr1-etrackerv2.vercel.app";
assertLocal(PROD, [PROD]);

const STOPS = [
  ["analytics", "/analytics"],
  ["budget", "/budget"],
  ["budget-entries", "/budget/entries"],
  ["far1", "/budget/far1"],
  ["new-budget-entry", "/budget/new"],
  ["accounting", "/accounting"],
  ["cashier", "/cashier"],
  ["coa", "/coa"],
];
const NEVER = /admin|profile|payee-accounts|users|employees|settings|recovery|deployment|email/i;

/** Blurs every data row: the structure of a screen, never its records. */
const TABLE_MASK_FN = () => {
  if (!document.getElementById("__tablemask")) {
    const s = document.createElement("style");
    s.id = "__tablemask";
    s.textContent = ".__tmask{filter:blur(6px)!important}";
    document.head.appendChild(s);
  }
  const cells = document.querySelectorAll(
    'tbody td, [role="row"] [role="cell"], [role="gridcell"]',
  );
  cells.forEach((el) => el.classList.add("__tmask"));
  return cells.length;
};

// From santol-municipal-portal/scripts/tour.mjs, as in lmis-prod.mjs.
const MASK_FN = () => {
  if (!document.getElementById("__tourmask")) {
    const s = document.createElement("style");
    s.id = "__tourmask";
    s.textContent = ".__mask{filter:blur(7px)!important;background:#d9cfe0!important;border-radius:3px}";
    document.head.appendChild(s);
  }
  const PAT = [
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
    /(\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}/,
  ];
  const hit = (t) => PAT.some((p) => p.test(t));
  const mark = (el) => el.classList.add("__mask");
  document.querySelectorAll("*").forEach((el) => {
    if (el.closest("script, style, .__mask")) return;
    const t = (el.textContent || "").trim();
    if (!t || !hit(t)) return;
    if ([...el.children].some((c) => hit((c.textContent || "").trim()))) return;
    mark(el);
  });
  document.querySelectorAll(".__mask").forEach((m) => {
    let box = m.parentElement;
    for (let i = 0; i < 4 && box; i++) {
      box.querySelectorAll("h2,h3,h4,p,span,div,td,li").forEach((el) => {
        if (el.children.length || el.classList.contains("__mask")) return;
        const t = (el.textContent || "").trim();
        if (!t || t.length > 42) return;
        if (/^[A-Z][\p{L}.'-]+(?:\s+[A-Z][\p{L}.'-]+){1,3}$/u.test(t)) mark(el);
      });
      box = box.parentElement;
    }
  });
};

async function mask(page) {
  await page.evaluate(TABLE_MASK_FN).catch(() => {});
  await page.evaluate(MASK_FN).catch(() => {});
}

async function visit(page, url) {
  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await settle(page, 1500);
  await mask(page);
  return res?.status() ?? 0;
}

const onAuthScreen = (url) => /\/login|\/signup|update-password/.test(new URL(url).pathname);

async function signIn(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  await page.goto(`${PROD}/login`, { waitUntil: "domcontentloaded", timeout: 90000 });
  console.log("\n  ▶ Sign in to eTracker in the browser window that just opened");
  console.log("    (and complete the bot check). Nothing you type is recorded.");
  console.log("    Waiting up to 10 minutes…\n");
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(1500);
    const u = new URL(page.url());
    if (u.origin === PROD && !onAuthScreen(page.url()) && u.pathname !== "/") {
      await settle(page, 1500);
      const state = await ctx.storageState();
      await ctx.close();
      console.log(`  signed in (landed on ${u.pathname}) — continuing\n`);
      return state;
    }
  }
  await ctx.close();
  return null;
}

const dir = outDir("mgb-region-1-etracker");
// Microsoft Edge, as Jan uses — a fresh, separate profile, never his own.
// Falls back to the bundled Chromium if Edge cannot be launched.
const browser = await chromium
  .launch({ headless: false, channel: "msedge" })
  .catch(() => chromium.launch({ headless: false }));
try {
  const session = await signIn(browser);
  if (!session) throw new Error("sign-in did not finish — nothing captured");

  // The recording starts signed OUT, on the public landing page; the session
  // is applied only after it (see below).
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: tmpVideoDir(), size: VIDEO_SIZE },
  });
  // Re-mask after any client-side re-render, so a table that loads late is
  // blurred before it is ever painted into a captured frame for long.
  await context.addInitScript(() => {
    const run = () => {
      document.querySelectorAll('tbody td, [role="row"] [role="cell"], [role="gridcell"]').forEach((el) => {
        el.style.filter = "blur(6px)";
      });
    };
    new MutationObserver(run).observe(document, { childList: true, subtree: true });
  });
  const page = await context.newPage();

  console.log(`eTracker  ${PROD}`);

  // 1 — the public landing page, signed out. It is also the poster: the
  // first frame of the recording.
  await visit(page, `${PROD}/`);
  await shot(page, path.join(dir, "00-tour.jpg"));
  await tourScroll(page, 3600);

  // 2 — hand over Jan's session (cookies, and any local storage the auth
  // client keeps), then continue into the app.
  await context.addCookies(session.cookies);
  const stored = session.origins.find((o) => o.origin === PROD)?.localStorage ?? [];
  if (stored.length) {
    await page.evaluate((items) => {
      for (const { name, value } of items) localStorage.setItem(name, value);
    }, stored);
  }

  let n = 1;
  let poster = true;
  for (const [name, route] of STOPS) {
    if (NEVER.test(route)) continue;
    const status = await visit(page, `${PROD}${route}`);
    const landed = new URL(page.url()).pathname;
    if (status >= 400 || onAuthScreen(page.url()) || NEVER.test(landed)) {
      console.log(`  skip   ${route} (${status} ${landed})`);
      continue;
    }
    if (!poster) {
      await shot(page, path.join(dir, "00-tour.jpg"));
      poster = true;
    }
    await shot(page, path.join(dir, `1${n}-${name}.jpg`));
    // Short holds: the banner loops ~40 s, not a 3-minute walkthrough.
    await tourScroll(page, 1400);
    n++;
  }

  await saveVideo(context, page, path.join(dir, "00-tour.webm"));
} finally {
  await browser.close();
}
console.log("\ndone — review EVERY file in public/work/mgb-region-1-etracker/ before committing.");
