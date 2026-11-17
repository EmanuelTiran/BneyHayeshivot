# Campaign QA — synthetic CI, not staging

This document records simulated browser UI checks in GitHub Actions. No isolated Render staging environment has been created or authorized. These results do not validate a deployed Render application, production authentication/session/CORS, real payments, or a deployed database.

## CI setup

The supplied browser job was added alongside the existing server/client jobs. Browser checkout explicitly uses `github.event.pull_request.head.sha` (or `github.sha` for manual runs), not an implicit PR merge commit. Playwright 1.56.1 and its Chromium are installed only in the ignored `.ariel-qa` test directory. The browser uses synthetic API fixtures, and blocks requests outside the local test server except for mocked API responses. No real names, bank accounts, messages or production donation records are used.

## Results and SHA evidence

- Initial head SHA: `883044ea73af691b4d0598f796e3c8645cf488d7`.
- [Run 44128315671](https://github.com/EmanuelTiran/BneyHayeshivot/actions/runs/44128315671): server and client succeeded; browser failed during dependency installation, before UI execution. Browser checkout logs explicitly show this head SHA.
- Diagnosis: `ubuntu-latest` resolved to Ubuntu 26.04, which the pinned Playwright 1.56.1 could not install Chromium dependencies for. The browser runner alone was pinned to Ubuntu 24.04. No runtime dependency upgrade was made.
- Corrected implementation SHA: `54df26b38b413a2578d39802ffd7ed2ca1ba2c86`.
- [Run 44128525935](https://github.com/EmanuelTiran/BneyHayeshivot/actions/runs/44128525935), completed 2026-11-17: **server success, client success, browser success**. Browser job `134198869158` logs confirm checkout of the exact implementation SHA above and successful desktop/mobile synthetic UI regressions. Server/client retain their original PR checkout behavior; browser explicitly checks the PR head.
- Browser coverage: standalone route, direct refresh, no public auth/analytics calls, bank reveal, pending-report UI acknowledgement, unpublication, existing admin guard, retry idempotency identity, draft settings and responsive layout. These are mocked UI observations, not proof of server-side or deployed staging behavior.
- This results update changes documentation only. Its own resulting head SHA cannot be embedded in the same Git commit; the follow-up CI run for that documentation head is checked separately before delivery. The immutable implementation run/SHA above records the tested workflow and browser code.

## Future staging gate — not executed

Only after explicit owner approval and creation of an isolated staging environment, use a separate database and synthetic data to verify: draft → 404; existing authentication; pending report; confirmed approval; goal thresholds 15,000/20,000; bank reveal; unpublication; direct navigation/refresh; robots/referrer headers; CORS and session behavior; mobile layouts. Agree on the test-data cleanup plan before starting, and execute cleanup only against that named isolated database. Never read/change existing donation records or run this plan against production.

The real staging plan remains pending. Earlier read-only infrastructure observations are not staging test evidence. No merge to main, production deployment or campaign publication is authorized by this CI task.
