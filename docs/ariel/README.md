# Ariel campaign integration — review notes

Implemented on `feature/ariel-family-campaign`, based on the supplied ZIP's `README.md` and `CODEX_INTEGRATION.md`. Validation date: 2026-11-17. No deployment, production database access, campaign publication, donation seeding or outreach was performed.

## Behavior

- `/ariel` and `/ariel/` render an independent page, outside the main site's Header, Footer, AuthProvider, Google OAuth provider and AnalyticsTracker. No public navigation or sitemap link was added.
- `/admin/ariel` is a section of the existing admin portal, behind its existing AuthProvider/AdminRoute. Every administrator API uses the existing JWT middleware and database-backed active administrator check.
- The campaign defaults to unpublished, with an empty beneficiary name. Publishing the campaign, exposing the beneficiary name and exposing the personal story are separate settings. Private stories are omitted from public API responses until opted in.
- Public reads return 404 while unpublished and do not create records. Bank details and reports also close when unpublished. An open page clears its content on the next poll after a 404.
- Reports remain pending until administrator confirmation. Confirmed donations alone affect totals. There is no seed, payment gateway, bank integration, tax receipt or message sending.
- The goal is ₪15,000 at exactly ₪15,000; it becomes ₪20,000 only above that threshold. The original goal and extension purpose are disclosed.
- Publishing requires an organizer, payment method, extension purpose and privacy/retention/deletion notice. Real payment details, a verified deadline and policy text must be supplied by the owner later.

## Changes from the supplied prototype

- Administrator writes and audit events use one MongoDB transaction: failure of either rolls back both. Audit snapshots contain amounts, methods, statuses and consent/publication flags, without donor names or contact information.
- Donation and settings edits require `expectedVersion`; stale writes return 409. Status transitions condition on the prior status/version. Manual and public submissions have unique, separate UUID idempotency namespaces. Public retries never return donor records.
- Boolean, date, amount and text input validation is strict. Only actual boolean consent permits name disclosure. Changing a donor name clears the UI's prior consent, and API name changes without explicit consent also remove it.
- CSV cells are quoted and formula/control-prefix injection is neutralized. React renders campaign and donor text without HTML interpolation, and payment URLs require HTTPS without URL credentials.
- Failed manual form submissions retain their data and idempotency key. API responses set `no-store`, `X-Robots-Tag` and `Referrer-Policy`. The page also sets robots/referrer metadata.
- Compatible security patches were applied to the existing lockfiles, including Mongoose, Express/JWT dependencies and Axios. No major-version migration was forced.

## Validation

- `node --test server/tests/arielCampaignLogic.test.js`: 8 passing tests.
- `npm test --prefix server`: 36 passing tests, including the existing analytics/date/session tests. New API tests run real Express, existing auth middleware and an isolated MongoDB replica set via `mongodb-memory-server`, without loading `.env` or connecting to production.
- Integration scenarios cover every admin endpoint's 401/403 behavior, unpublished defaults/no seeds, strict settings, privacy filtering, pending/idempotent reports, concurrent confirmation and manual retries, goal boundaries, cancellation/rejection, stale edits, rate limits, and rollback on audit failure for creation/status/edit/settings.
- `npm run build --prefix client -- --outDir ../.ariel-qa/build`: passed. Output goes to an ignored QA folder to preserve the existing tracked `client/dist` files. Vite still reports large existing application chunks.
- ESLint passed for all modified/new client files.
- `node scripts/ariel-browser-check.cjs`: desktop 1440×1050 and mobile 390×844 passed using installed Chrome and synthetic API fixtures. Checks include direct loading/refresh, no public auth/analytics calls, bank reveal, report submission, hiding after unpublication, existing login guard, form retry identity, draft settings and absence of horizontal page overflow. No requests reach production or third parties. These are browser UI regressions, not a live payment or deployed end-to-end test.

To reproduce browser checks, install `playwright` locally with `npm install --prefix .ariel-qa --no-save playwright`, build as above, and run the script. It uses installed Chrome by default; `ARIEL_BROWSER_CHANNEL=msedge` selects installed Edge. MongoDB integration tests may download a test binary on first run. Node 20.19+ is required by the development-only MongoDB test dependency.

## Before any future publication

- Production MongoDB must support transactions (Atlas or a replica set). Administrator writes intentionally fail rather than perform unaudited partial writes on standalone MongoDB. This was verified with a local replica set; production was not inspected.
- Render's static frontend still needs path-specific `X-Robots-Tag: noindex, nofollow, noarchive` for `/ariel` and `/ariel/`, preferably also `Referrer-Policy: no-referrer`, and verification of the existing SPA rewrite (`/*` to `/index.html`). API headers and React metadata do not configure the static host. No Render settings were changed.
- Verify actual deployment CORS, JWT/session behavior and direct navigation on the configured hosts in an authorized staging environment. Existing origin restrictions and admin authentication implementations were preserved.
- Keep the campaign unpublished until the owner supplies payment details, retention/deletion policy, an accurately verified deadline if desired, the expansion purpose, and separate decisions about identity/story disclosure.
- Administrator lists/CSV contain the latest 500 donations and latest 80 audit events; totals use all confirmed donations. Pagination and a complete historical export are not included.
- Dependency audit after compatible patches: server has 1 high Nodemailer advisory; client has 1 high Vite and 7 moderate advisories (Vite/esbuild, React Router and build tooling). Remaining major upgrades require a separate migration/regression review; use only local trusted development access in the meantime. No critical advisories remain in the server/client audits. The campaign does not use Nodemailer.
- The tracked `client/.env.local` contains only the analytics-enabled flag. No secret values were copied into this change; the pre-existing untracked backup was left intact and ignored.

## Screenshots

All names, payment details and donations below are synthetic UI fixtures, including the two example ₪500 donations; no real records were created.

| View | Desktop | Mobile |
| --- | --- | --- |
| Public page | [Screenshot](screenshots/public-desktop.png) | [Screenshot](screenshots/public-mobile.png) |
| Existing admin portal | [Screenshot](screenshots/admin-desktop.png) | [Screenshot](screenshots/admin-mobile.png) |
