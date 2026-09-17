-- portfolio-visits — a per-IP daily cap (R25, 2026-09-17).
--
-- Why: a visitor is SHA-256(salt, day, IP, user agent), so a script that
-- changes its user agent on every request was a new visitor every time — up
-- to thirty a minute per IP under HIT_LIMITER, ~43,000 a day. Each row now
-- also carries `ip`, SHA-256(salt, day, IP), and the Worker inserts only
-- while that IP has fewer than IP_DAY_CAP distinct visitors that day (and,
-- for page_hits, on that path). One IP then adds at most IP_DAY_CAP a day.
--
-- Privacy is unchanged: a salted, per-day hash like `visitor`, not reversible
-- to an address, not linkable across days, deleted by the same nightly cron
-- after two days. Rows written before this migration have `ip` NULL and do
-- not count toward anyone's cap; they are gone within two days.
--
-- Apply BEFORE deploying the Worker that writes the column:
--   npx wrangler d1 migrations apply portfolio-visits --remote

ALTER TABLE visits ADD COLUMN ip TEXT;
ALTER TABLE page_hits ADD COLUMN ip TEXT;

CREATE INDEX visits_day_ip ON visits (day, ip);
CREATE INDEX page_hits_day_ip_path ON page_hits (day, ip, path);
