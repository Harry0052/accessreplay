# Validation

Access date: 2026-11-23. The checks below use the in-repo synthetic shop. They are not a conformance audit and they do not measure screen-reader speech.

## Environment

| Item | Observed |
| --- | --- |
| OS | Linux 6.12.113+ x86_64 |
| Node.js | v22.23.4 |
| npm | 10.9.9 |
| Playwright | 1.65.1 |
| Chromium | Chrome for Testing 159.0.8154.6 (Playwright build v1255), headless |
| Fixture tree | 28184 bytes under `fixtures/` |
| Source tree | 40939 bytes under `src/` at the time of measurement |

Playwright was installed with `npx playwright install --with-deps chromium`. The demo does not contact any host except `127.0.0.1`.

## Commands

```sh
npm ci
npx playwright install chromium
npm run check
npm test
node cli.mjs demo
```

`npm run check` is `node --check` on `cli.mjs`, `src/*.mjs`, and `test/*.mjs`. There is no separate typechecker. The project is plain JavaScript.

`npm audit --omit=dev` on 2026-11-23 reported 0 vulnerabilities.

## Acceptance metric

Tolerance is exact string equality on the normalized trace and on the oracle categories. There is no numeric threshold. The fixture is synthetic and authored in this repository. A second demo in a fresh output directory produced the same stdout summary as the first.

Observed `node cli.mjs demo` on this host: 10.689 seconds, exit 0.

| Case | Expected | Observed |
| --- | --- | --- |
| control, two runs | Normalized traces equal, run ids omitted, zero semantic failures | Pass. Traces matched `fixtures/oracle/checkout-control.json`. |
| name-mutant | `evaluated_regression` at `reach-checkout`, name empty, focus still `#place` | Pass. Message names `Place demo order.` |
| focus-mutant | `evaluated_regression` at `escape-cart`, focus `body`, expected control `#add-pen` | Pass. |
| tab-loop | `tab_limit` at `reach-checkout` within 8 tabs | Pass. Last focus was `#trap-a` "Offer A". |
| timeout | `application_timeout`, no semantic comparison | Pass. Ready wait of 1500 milliseconds expired. |
| unsupported | `unsupported_observation` at `focus-search`, not a regression | Pass. Browser name `Search products` was recorded and not scored. |
| invalid click | `unapproved_action` before a browser result | Pass. Exit 2. |
| external URL in the journey file | `external_navigation` | Pass. |
| redirect build | `wrong_origin` for `https://example.com` before checkpoints | Pass. |

Manual screen-reader rows stay `unreviewed`. The sheet asks for the reader, operating system, and version. That gate was not executed here because this environment has no NVDA, VoiceOver, or Orca session.

## Performance budget

Budget: `node cli.mjs demo` finishes in under 90 seconds. The budget covers seven cold Chromium contexts and one supplemental axe scan per scored checkpoint, with margin for a slower CI runner. The observed run was 10.689 seconds. `test/demo.test.mjs` fails the demo if one run reaches 90 seconds.

## Trust boundaries

- Journey JSON is size-capped at 65536 bytes. Limits, action names, and URI schemes are rejected before Chromium launches.
- Approved actions are only Tab, Shift+Tab, Enter, Escape, and synthetic text. The runner does not evaluate author scripts from the journey.
- The fixture server listens on `127.0.0.1`, serves files under `fixtures/shop`, and rejects `..` and `%2e%2e` in the raw request target.
- Playwright routes abort any page request whose origin is not that server. `data:` and `blob:` URLs are allowed. A navigation to `https://example.com` becomes `wrong_origin`.
- Reports are a single `<build-id>.json` plus `summary.json` and `summary.html` inside the directory passed as `--out`. Build ids that leave that directory are rejected.
- HTML export escapes text. A fixture name containing markup is not rendered as HTML.
- axe-core and `@axe-core/playwright` are MPL-2.0 and are not modified. Playwright is Apache-2.0. The project license is MIT. No dependency advisory was open at validation time.
- There is no native add-on, so compiler sanitizers do not apply.
- Typed text in the trace is the journey's declared synthetic word `pen`, not a log of a person's keys.

## Defect found and covered

Comparing role before focus id reported the document body as role `none` and hid the restoration fault. Comparison now checks focus id first. `test/journey.test.mjs` requires the Escape message to name `#add-pen` and "Add pen".

## Residual limits

- Browser role, name, focus, and the status element do not prove what a screen reader says.
- The manual sheet ships unreviewed. Filling it in is a separate release gate and needs a real reader.
- axe findings, including any landmark noise, do not decide the journey result.
- Only Chromium is in scope. Firefox and WebKit were not measured.
