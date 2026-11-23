# Grokbot progress

## P01 — Research overlap and confirm the MVP

- **Phase and status:** P01 PASS
- **Files changed:** `docs/overlap.md`, `docs/project-contract.md`, `docs/grokbot-progress.md`, `docs/research/p01-probe-fixture.html`, `docs/research/p01-probe-result.json`
- **Commands and results:**
  - `npm view` on 2026-11-23: `playwright@1.65.1` Apache-2.0, `axe-core@4.14.1` MPL-2.0, `@axe-core/playwright@4.14.0` MPL-2.0, `@guidepup/guidepup@0.40.0` MIT, `a11y-journey-evidence@0.1.0` MIT, `@accessible-by-default/checks@0.5.0` MIT.
  - GitHub API: Accessibility Insights for Web MIT, release `web@2.49.0` (2026-09-08). Guidepup MIT. AccessForge LICENSE text is Apache-2.0; `IMPLEMENTATION_STATUS.md` reports Phases 0–1 only, no browser engine.
  - Observed probe (`/tmp/p01-probe`, Node.js v22.23.4, Google Chrome 157.0.8103.50, Playwright channel `chrome`): `controlTracesMatch: true`. Name mutant first divergence `tab-after-1` with accessible name `""` on `#place`. Focus mutant first divergence `escape` with focus id `body`. Tab loop never reached `#place` in 8 tabs. axe rule ids added `button-name` only for the name mutant. Focus and loop scans matched the control (`landmark-one-main`, `region`).
- **Artifact paths:** `docs/overlap.md`, `docs/project-contract.md`, `docs/research/p01-probe-result.json`, `docs/research/p01-probe-fixture.html`
- **Open issues:** FastPass and Guidepup were not executed (extension and real screen reader are absent here). The probe used system Chrome, not Playwright's bundled Chromium. `element.focus()` on `document.body` during dialog close did not stick; blur after close did. Landmark axe findings must not decide the journey verdict.
- **Next phase:** P02

## P02 — Create the repository and data contracts

- **Phase and status:** P02 PASS
- **Files changed:** `package.json`, `package-lock.json`, `.gitignore`, `README.md`, `cli.mjs`, `src/bounds.mjs`, `src/errors.mjs`, `src/parse.mjs`, `src/normalize.mjs`, `src/manifest.mjs`, `docs/schema.md`, `fixtures/**`, `test/parse.test.mjs`, `test/normalize.test.mjs`, `test/cli.test.mjs`
- **Commands and results:**
  - `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install` added the pinned lockfile (`playwright@1.65.1`, `@axe-core/playwright@4.14.0`).
  - `npm test`: 11 passed, 0 failed (Node.js v22.23.4).
  - `node cli.mjs validate fixtures/journeys/checkout.journey.json` exit 0. Stdout: `{"ok":true,"journeyId":"shop-checkout","fixtureLabel":"valid-checkout","steps":8,"schemaVersion":"1.0.0"}`.
  - `node cli.mjs validate fixtures/journeys/invalid-action.journey.json` exit 2. Category `unapproved_action`. Stderr names the approved actions and says the journey was not started.
  - `node cli.mjs verify-manifest` exit 0. 15 fixture files, license MIT.
- **Artifact paths:** `fixtures/journeys/checkout.journey.json`, `fixtures/journeys/invalid-action.journey.json`, `fixtures/oracle/checkout-control.md`, `fixtures/oracle/checkout-control.json`, `fixtures/manifest.json`, `docs/schema.md`
- **Open issues:** The browser runner is not part of this phase. Playwright's Chromium was not downloaded yet. Landmark noise from axe is still only a documented constraint.
- **Next phase:** P03

## Status index

| Phase | Status |
| --- | --- |
| P01 | PASS |
| P02 | PASS |
| P03 | not started |
| P04 | not started |
| P05 | not started |
| P06 | not started |
| P07 | not started |
