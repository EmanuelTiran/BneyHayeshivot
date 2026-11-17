# Final preparation review — Draft PR #1

## Verified

- Re-ran 36 server tests successfully, including all five admin endpoints with missing/invalid JWT, a non-admin whose token claims admin, and an inactive admin. Existing AuthProvider/AdminRoute and server authorization are reused; no production account, role or authentication mechanism was added. Test users exist only in the disposable local MongoDB test database.
- Draft public data, bank details and report endpoints return 404; reads do not seed campaign/donation records. Tests also verify that unpublishing closes these endpoints and the UI clears previously displayed content on the next poll. The SPA shell itself remains downloadable: draft privacy is enforced by withholding campaign data at the API, rather than by password protecting the URL.
- The MongoDB URI available in local configuration was checked with the read-only `hello` command: replica set present, logical sessions supported, maxWireVersion 25. These are transaction prerequisites, not proof of the deployed Render service's connection identity or its database user's write permissions. No records were read and no production transaction was started. Local replica-set integration tests verify successful transactions and rollback on audit failure.
- Build passed again. Desktop and mobile browser regressions and screenshots were regenerated from synthetic fixtures. The existing site's personal dedication was removed from the screenshot fixture DOM before capture; the actual site/footer was not modified.
- Added `.github/workflows/campaign-checks.yml`: pull requests to main and manual dispatch run separate Node 22 server-test and client-build jobs, using npm ci, read-only repository permissions, no production secrets, no deployment actions and time limits. Remote execution must be checked after the branch update; local success does not establish a green remote CI run.

## Privacy scope and limitations

Campaign defaults contain no real beneficiary identity, private story, donor contacts or payment account. Current review screenshots contain synthetic names and payment placeholders. Public serialization excludes donor contacts/references/notes and unapproved names/stories. No outreach templates with real family details were imported. A text scan of tracked source/docs found no matching embedded MongoDB credentials/private-key/AWS-key patterns; this is a targeted scan, not an exhaustive secret audit of binary assets or Git history.

The existing main site's personal dedication and existing contact/email content remain in its source, outside this campaign change. Their publication intent cannot be inferred conclusively from code. Earlier commits of the admin screenshots still contain the existing site's dedication; regenerating current images does not remove Git history. No history rewrite was performed. These existing/historical disclosures need owner review if confidentiality is required.

## Remaining release risks and safe remediation

| Risk | Evidence / next step |
| --- | --- |
| Render configuration unverified | Workspace selection is required by the connector. Do not assume rewrite rules, per-path headers, deployed branch, environment origins or the deployed Mongo URI match local configuration. Verify read-only once the workspace is confirmed. |
| Static-host indexing/privacy headers | Configure and verify path-specific noindex/nofollow/noarchive and no-referrer for `/ariel` and `/ariel/` before publication. API headers and React metadata alone do not configure Render's static host. |
| Remaining server dependency advisory | npm audit still reports Nodemailer high. The compatible fixes are already applied; the proposed complete fix is Nodemailer 10.6.0, a major upgrade. Safest path: separate upgrade with mocked SMTP/Resend tests and no real sends, followed by staging verification. Campaign code does not invoke mail. |
| Remaining client advisories | npm audit reports Vite high plus seven moderate findings across Vite/esbuild, React Router and build tooling. Full suggested fixes include Vite 8 and React Router 7, requiring coordinated plugin/Node/router migration tests. Keep development servers local and test upgrades in a separate branch; do not force-upgrade the campaign PR without regression evidence. |
| Deployment readiness | No live end-to-end authentication/CORS/payment verification was performed. An explicitly authorized staging test is still needed. |
| Content and privacy decisions | Owner must supply approved payment details, extension purpose, retention/deletion policy and verified deadline. Name and story visibility stay off until separately approved. |
| Scale/export | Lists and CSV cover 500 recent donations; audit view covers 80 recent events. Totals use all confirmed donations, but complete historical export/pagination is absent. |
| Revocation/cache | API is no-store; an already-open browser may display previously fetched data until the next visible-tab poll (12 seconds). Unpublishing cannot revoke information already copied or shared. |
| Build size | Existing application chunks exceed Vite's recommendation. This is a performance limitation, not a failed build. |

No merge, deployment, campaign publication, seed or production configuration change was performed during this review.
