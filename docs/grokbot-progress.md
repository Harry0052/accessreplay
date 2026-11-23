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

## P03 — Build the working core

- **Phase and status:** P03 PASS
- **Files changed:** `src/serve.mjs`, `src/observe.mjs`, `src/run.mjs`, `src/report.mjs`, `cli.mjs` (`run`), `test/journey.test.mjs`, `fixtures/shop/redirect/index.html`, `fixtures/journeys/redirect.journey.json`, `fixtures/oracle/expected-outcomes.json`, `fixtures/manifest.json`
- **Commands and results:**
  - `npx playwright install --with-deps chromium` installed Chrome for Testing 159.0.8154.6 (Playwright chromium v1255).
  - `node --test --test-concurrency=1 test/journey.test.mjs` passed. Control runs produced equal normalized traces matching `fixtures/oracle/checkout-control.json` with different run ids. `name-mutant` failed at `reach-checkout` with observed name `""` on `#place`. `focus-mutant` failed at `escape-cart` with observed focus `#body` and the message named expected `#add-pen` ("Add pen"). `tab-loop` returned `tab_limit`. `timeout` returned `application_timeout` with no checkpoints. `unsupported` returned `unsupported_observation` and was not scored as a regression. `redirect` returned `wrong_origin` for `example.com` before any checkpoint.
  - `npm test` later in P04: 16 passed, including `node cli.mjs run` exit 0 for control and exit 1 for the name and focus mutants.
- **Artifact paths:** per-build JSON from `node cli.mjs run --journey fixtures/journeys/checkout.journey.json --build <id> --out <dir>`. The normalized trace is the `normalizedTrace` array.
- **Open issues:** Manual speech is intentionally unscored. axe rule ids are stored on checkpoints and do not affect status.
- **Next phase:** P04

## P04 — Ship the user workflow and reports

- **Phase and status:** P04 PASS
- **Files changed:** `src/demo.mjs`, `src/html-report.mjs`, `src/keyboard.mjs`, `cli.mjs` (`demo`), `fixtures/observations/manual.json`, `test/demo.test.mjs`, `test/html-report.test.mjs`, `README.md`, `fixtures/manifest.json`
- **Commands and results:**
  - `npm test`: 16 passed, 0 failed, about 32.5 seconds (Node.js v22.23.4).
  - `node cli.mjs demo --out <temp>` exit 0. Stdout JSON `ok: true`, manual state `unreviewed`. Stderr includes the keyboard sequence (`Type "pen"`) and the first divergences for `escape-cart` and `reach-checkout`.
  - HTML export contains `unreviewed`, `fixtures/journeys/checkout.journey.json`, and `fixtures/shop/name-mutant/index.html`. `name-mutant.json` records observed name `""` on focus `#place`.
  - `node cli.mjs run` on `fixtures/journeys/invalid-action.journey.json` exit 2 in under 5 seconds. Stderr lists the approved actions and says the journey was not started.
- **Artifact paths:** `<out>/summary.html`, `<out>/summary.json`, `<out>/<build>.json`
- **Open issues:** The checked-in manual sheet has empty reader, OS, and version fields, so every row stays unreviewed. That is the shipped state.
- **Next phase:** P05

## Status index

| Phase | Status |
| --- | --- |
| P01 | PASS |
| P02 | PASS |
| P03 | PASS |
| P04 | PASS |
| P05 | not started |
| P06 | not started |
| P07 | not started |
