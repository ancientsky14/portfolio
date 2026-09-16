"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";

/**
 * " · 1,234 visits" beside the handle in the rail, after the reference shell.
 * It replaced the role on that line at Jan's request (2026-09-13).
 *
 * Live, from the portfolio-visits Worker (workers/visits/, SITE.visitsApi),
 * which replaced GoatCounter because its public total lagged hours:
 *
 *   · On load, one POST /hit per browser session adds this visitor (the
 *     Worker counts a visitor once per Manila day) and returns the new total
 *     at once — the visitor sees their own visit land.
 *   · Then GET /count every 60 s while the tab is visible, and straight away
 *     when it becomes visible again — other visitors arrive within a minute.
 *   · Never counts on localhost or in an automated browser; those only read.
 *
 * It also carries the per-page beacon (POST /view, one per route change) —
 * see the effect below for why that cannot be folded into /hit. This
 * component is the right home for it because it is already a client
 * component mounted once in the shell, so the beacon adds no new bundle.
 *
 * The Worker's total includes a fixed +3,000 start offset (Jan, 2026-09-15,
 * workers/visits/migrations/0002_start_offset.sql); this renders it as given.
 *
 * The Worker's number or nothing: until it loads, or when it cannot (no API
 * set, offline, blocked), this renders nothing and the line reads just the
 * handle. Never a client-side placeholder.
 */

const HIT_KEY = "visit-hit";
const POLL_MS = 60_000;

/** Real visitors only: never localhost, never an automated browser. */
function realVisitor(): boolean {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return false;
  return !navigator.webdriver;
}

function mayCount(): boolean {
  if (!realVisitor()) return false;
  try {
    return sessionStorage.getItem(HIT_KEY) !== "1";
  } catch {
    return true;
  }
}

export function VisitCount() {
  const api = SITE.visitsApi;
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  // Which pages get read (workers/visits migration 0003). Separate from the
  // visit above on purpose: /hit fires once a session, so it only ever knows
  // the page someone landed on. This fires per route, and the Worker still
  // counts a visitor once per day per path, so it is reads-by-people rather
  // than page loads. Nothing on the site displays it — the reply is ignored,
  // and the rail keeps showing the single total.
  useEffect(() => {
    if (!api || !pathname || !realVisitor()) return;
    const p = pathname.endsWith("/") ? pathname : `${pathname}/`;
    // No body and no custom headers, so it stays a simple CORS request with
    // no preflight — the path rides in the query string.
    void fetch(`${api}/view?p=${encodeURIComponent(p)}`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [api, pathname]);

  useEffect(() => {
    if (!api) return;
    let alive = true;

    const take = (body: { count?: unknown }) => {
      if (alive && typeof body.count === "number" && Number.isFinite(body.count) && body.count >= 0) {
        setCount(body.count);
      }
    };

    const read = () =>
      fetch(`${api}/count`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then(take)
        .catch(() => {});

    const start = async () => {
      if (!mayCount()) return read();
      try {
        // No body and no custom headers: a simple CORS request, no preflight.
        const r = await fetch(`${api}/hit`, { method: "POST", keepalive: true });
        if (!r.ok) return read();
        take(await r.json());
        try {
          sessionStorage.setItem(HIT_KEY, "1");
        } catch {
          // Storage blocked: the Worker's per-day key still stops a recount.
        }
      } catch {
        return read();
      }
    };

    void start();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void read();
    }, POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void read();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [api]);

  if (count === null) return null;
  return (
    <>
      {" · "}
      <span className="font-semibold text-text-2">
        {count.toLocaleString("en-PH")} visit{count === 1 ? "" : "s"}
      </span>
    </>
  );
}
