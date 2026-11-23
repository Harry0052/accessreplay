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

## Status index

| Phase | Status |
| --- | --- |
| P01 | PASS |
| P02 | not started |
| P03 | not started |
| P04 | not started |
| P05 | not started |
| P06 | not started |
| P07 | not started |
