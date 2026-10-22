/**
 * MGBR1-FIRMS — the production sign-in page, and nothing past it.
 *
 * The one reviewed exception to "local instances only" (scripts/capture/
 * lib.mjs): the live sign-in screen has no records behind it, and it is the
 * page the case study already links to. The script never signs in, never
 * types into a field, and refuses any other origin.
 *
 * The app's inside is captured from a local, synthetic-data stack instead
 * (scripts/capture/etracker.mjs, once Docker is running).
 *
 *   node scripts/capture/etracker-signin.mjs
 */

import { chromium } from "playwright";
import path from "node:path";
import { VIEWPORT, assertLocal, outDir, shot, settle } from "./lib.mjs";

const PROD = "https://mgbr1-etrackerv2.vercel.app";
assertLocal(PROD, [PROD]);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: VIEWPORT });
  // The root is a public landing page; sign-in is app/(auth)/login.
  await page.goto(`${PROD}/login`, { waitUntil: "domcontentloaded" });
  await settle(page, 2000);
  // Guard: if the app ever shows anything but its sign-in screen to an
  // anonymous visitor, stop rather than capture it.
  const hasPassword = await page.locator('input[type="password"]').count();
  if (!hasPassword) throw new Error(`no sign-in form at ${page.url()} — not capturing`);
  await shot(page, path.join(outDir("mgb-region-1-etracker"), "90-signin.jpg"));
} finally {
  await browser.close();
}
