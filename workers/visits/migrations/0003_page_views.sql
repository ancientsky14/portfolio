-- portfolio-visits — per-page counts (2026-09-16).
--
-- Why: the rail's single total says people arrive, not what they read. There
-- was no way to tell which case study earns attention, or whether /contact is
-- reached at all — which is the one thing a portfolio exists to find out.
--
-- Same privacy design as `visits`, deliberately: a page view is keyed by the
-- same `visitor` hash — SHA-256 of a secret salt, the Manila day, the IP and
-- the user agent — so it cannot be reversed to a person, cannot be linked
-- across days, and a reader refreshing a page does not inflate the number.
-- The Worker's nightly cron deletes page_hits older than two days along with
-- visits; page_views keeps the running count, as totals does.
--
-- There is NO public endpoint for this and no UI. The rail still shows the
-- one total. Read the breakdown from a terminal:
--
--   npx wrangler d1 execute portfolio-visits --remote \
--     --command "SELECT path, count FROM page_views ORDER BY count DESC"
--
-- page_views carries NO start offset. Migration 0002 added +3,000 to the rail
-- total only; these rows start at a real zero, so the two will not reconcile
-- and are not meant to.

CREATE TABLE page_hits (
  day TEXT NOT NULL,
  visitor TEXT NOT NULL,
  path TEXT NOT NULL,
  PRIMARY KEY (day, visitor, path)
);

CREATE TABLE page_views (
  path TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

-- Counting lives in the database, as it does for `visits`: a new
-- (day, visitor, path) adds one, and INSERT OR IGNORE on a repeat inserts
-- nothing, so the trigger never fires. The nightly DELETE never touches a count.
CREATE TRIGGER page_views_count AFTER INSERT ON page_hits
BEGIN
  INSERT INTO page_views (path, count) VALUES (NEW.path, 1)
    ON CONFLICT(path) DO UPDATE SET count = count + 1;
END;
