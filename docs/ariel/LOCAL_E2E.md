# Local full-stack campaign test

Date: 2026-11-17. Branch: `feature/ariel-family-campaign`. Application baseline: `8e532ac6d7841ef0c571443431010b8ee1b1717f`. Harness: `scripts/ariel-local-e2e.cjs`, added with this report. Final run exited successfully with both viewport suites passing.

## What actually ran

React/Vite UI → HTTP → the existing `server/server.js` Express application, including its existing auth/session middleware and all routes → a newly created MongoMemoryReplSet. **No API responses were mocked, fulfilled or rewritten.** A test-only Vite configuration injects the disposable server's loopback API address; application files and auth behavior are unchanged.

The server process receives an explicit environment allowlist, a generated loopback MongoDB URI, test-only JWT/analytics secrets and a temporary working directory without `.env`. It does not inherit production credentials or load the repository's `.env`. Vite uses `envFile: false`. Browser traffic outside loopback is blocked rather than simulated. Google sign-in/fonts and any remote payment destinations cannot be contacted. Email/password login, JWT, refresh cookie and actual database-backed administrator authorization are used. No Google OAuth login was attempted.

A synthetic administrator fixture was created with the existing User model/password hashing only in the temporary database. All contact/account values are placeholders; no real payment is initiated. The Express listener binds loopback on an OS-assigned port; Vite uses loopback port 5174. Both use the same `127.0.0.1` hostname with distinct ports, exercising actual CORS and credential handling.

Environment: Windows, Node 24.22.1, installed Chrome, local Playwright 1.65.1. Desktop viewport 1440×1050; mobile viewport 390×844. Mobile means Chrome viewport emulation, not a physical mobile device.

## Results — both desktop and mobile

| Requested check | Actual observation | Result |
| --- | --- | --- |
| Existing administrator login | Existing `/login` form submits to real `/api/auth/login`; HTTP 200, HttpOnly refresh cookie, subsequent navigation restores the real session and opens AdminRoute-protected campaign management. | Pass |
| Open draft campaign | Fresh visitor sees unavailable message. Public campaign API returns 404. The SPA HTML shell itself is still served. | Pass |
| Local-only publication | Organizer, synthetic bank and policy/expansion settings entered through the admin UI; publish checkbox and existing confirmation dialog used. Database `published` becomes true. | Pass |
| Report and Pending | Visitor submits ₪180 through the real report form. MongoDB contains one pending donation; public total remains zero. | Pass |
| Confirm from admin UI | Admin refreshes the donation list and clicks its existing approval control. MongoDB transitions the donation to confirmed. | Pass |
| Automatic progress update | Already-open donor page changes its total to ₪180 through the application's actual 12-second polling. No reload or browser clock manipulation is used. | Pass |
| Goal threshold | Admin manually records synthetic receipts of ₪14,820 and ₪1 with explicit receipt confirmation. Real API reports total/goal 15,000/15,000 at the boundary; donor UI subsequently displays expansion and total 15,001 with goal 20,000. | Pass |
| Void and recalculate | Admin voids the newest ₪1 receipt. Database records void; public total/goal returns to 15,000/15,000 and expansion disappears on the open page through polling. | Pass |
| Unpublish and block | Admin unchecks publication. Open donor page clears content through polling; campaign GET, bank GET and report POST return 404. Direct refresh remains unavailable. | Pass |
| Desktop/mobile | Entire flow executed separately in both viewport sizes, without horizontal page overflow. Bank reveal fetched real API data and displayed only the synthetic account. | Pass |

Each viewport finished with two confirmed donations (₪180 and ₪14,820), one void donation (₪1), no pending donations, total ₪15,000 and campaign unpublished. The database is reset between viewports, then destroyed after the run.

## Harness issues found and resolved

Initial attempts exposed test setup errors, not a confirmed campaign authentication defect: a fixed-port readiness check did not establish that the responding process was the newly spawned test server; the harness now selects a new port and waits for its own process's Express/Mongo readiness messages. Mixing `localhost` UI with a `127.0.0.1` API also prevented local SameSite session restoration; the harness now consistently uses `127.0.0.1`. Tailwind's test working directory was corrected so the real frontend styles load. No production auth, cookie, dependency or campaign runtime code was changed.

No remaining functional failure was observed in the ten requested flows. This is limited to the exercised scenarios and local environment.

## Cleanup and reproduction

The final run closed both browser contexts/browser, stopped Vite and the spawned Express child, disconnected Mongoose, and stopped the temporary replica set. MongoMemoryReplSet removes its temporary database storage. Synthetic users, sessions, donations and audit events are therefore disposable; no production database was selected or cleaned. Only local diagnostic results/screenshots remain under ignored `.ariel-qa/local-e2e`, with the two approved synthetic screenshots copied into this report's directory.

With existing client/server dependencies installed, install test-only Playwright under `.ariel-qa` if necessary (`npm install --prefix .ariel-qa --no-save playwright@1.65.1`), then run `node scripts/ariel-local-e2e.cjs`. Installed Chrome is used by default; `ARIEL_BROWSER_CHANNEL=msedge` selects installed Edge. Do not supply production environment files. The harness refuses a `.env` in its temporary working directory and refuses an occupied frontend port.

## Readiness for real staging

The tested campaign flows are ready to proceed to an **owner-approved isolated staging setup**. This run did not create or validate Render staging, use HTTPS, test production cross-site cookie behavior, send email, make payments or prove production readiness. It does not validate real Google OAuth or all mobile browsers. Known dependency advisories, static-host robots/referrer headers, exact deployment CORS/session settings and coordinated frontend/backend release planning remain staging/release gates described in `FINAL_REVIEW.md`.

Before staging, approve the environment and separate database, synthetic credentials/data, allowed endpoints and cleanup plan. Then repeat the real deployed flows and verify HTTPS cookies, robots/referrer response headers, CORS/session restoration and direct navigation. The local polling behavior can retain fetched content for up to the next 12-second visible-tab poll after unpublication; it cannot revoke copied information.

No main merge, Render deployment, production campaign publication, real payment, external message or production donation change was performed.

## Screenshots from the real local stack

- [Desktop, after void/recalculation](local-e2e/desktop.png)
- [Mobile, after void/recalculation](local-e2e/mobile.png)
