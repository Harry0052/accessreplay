# AccessReplay

Replay one keyboard journey against a local fixture shop and name the first step where focus, role, accessible name, or status text changed.

Version 0.1.0 is a local tool. It does not certify conformance, log into a site, or record a screen reader. Browser evidence and manual speech observations stay separate.

## Prerequisites

- Node.js 22 (this repository was developed on v22.23.4) and npm 10
- A Chromium build installed by Playwright, only when a later command launches a browser. `npm test` and `node cli.mjs validate` do not launch one and do not fetch page content

No paid service and no account are required.

## Install

From a checkout of this repository:

```sh
npm ci
```

`npm ci` installs the pinned Node packages from `package-lock.json`. It may download Playwright's browser into the local Playwright cache. The fixture runner, once enabled, serves only files from `fixtures/shop` and does not request other hosts. Validation itself reads local JSON.

## Demo

Install Chromium once, then run the fixture demo. It replays the checkout journey on the control and on each seeded build, writes an HTML report and a JSON summary, and exits 0 when every first failing step matches the hand oracle.

```sh
npx playwright install chromium
node cli.mjs demo
```

The report is `reports/demo/summary.html`. The JSON summary is `reports/demo/summary.json`. Per-build traces are `reports/demo/<build>.json`. Stdout is the JSON summary. Stderr is the keyboard sequence and the first divergence for each build.

On a matching run, stderr includes:

- `control: pass`
- `focus-mutant` at `escape-cart`, expected focus `#add-pen` ("Add pen"), observed focus `#body`
- `name-mutant` at `reach-checkout`, expected name `Place demo order.`, observed name empty, selector `#place` unchanged
- a manual screen-reader sheet whose state is `unreviewed`

The sheet asks a person to verify announcements. It does not claim those announcements were heard. Record the screen reader, operating system, and version in `fixtures/observations/manual.json` before changing a row from `unreviewed`.

An unapproved journey fails before a browser opens:

```sh
node cli.mjs run --journey fixtures/journeys/invalid-action.journey.json --build control --out reports/run
```

Exit code `2`. The message names `click` and the approved actions.

## Check the fixture contract

Accept the labeled valid journey:

```sh
node cli.mjs validate fixtures/journeys/checkout.journey.json
```

Expected stdout:

```json
{"ok":true,"journeyId":"shop-checkout","fixtureLabel":"valid-checkout","steps":8,"schemaVersion":"1.0.0"}
```

Exit code `0`.

Reject the labeled invalid journey (a `click`, which is not an approved action):

```sh
node cli.mjs validate fixtures/journeys/invalid-action.journey.json
```

Expected exit code `2`. Stdout is JSON with `"category":"unapproved_action"`. Stderr repeats the message, including the approved action list: tab, shiftTab, enter, escape, and type.

Run one local build after installing Chromium. This writes a JSON report and prints the first disagreement on stderr when a build fails:

```sh
npx playwright install chromium
node cli.mjs run --journey fixtures/journeys/checkout.journey.json --build control --out reports/run
node cli.mjs run --journey fixtures/journeys/checkout.journey.json --build name-mutant --out reports/run
node cli.mjs run --journey fixtures/journeys/checkout.journey.json --build focus-mutant --out reports/run
```

`control` exits 0. `name-mutant` exits 1 at step `reach-checkout` because `#place` has no accessible name. `focus-mutant` exits 1 at step `escape-cart` because focus is the document body instead of `#add-pen` ("Add pen"). Reports are `reports/run/<build>.json`. The `normalizedTrace` omits the run id.

Check fixture checksums:

```sh
node cli.mjs verify-manifest
npm test
```

The hand-calculated control trace lives in `fixtures/oracle/checkout-control.md`. Input and output shapes live in `docs/schema.md`. Fixture terms live in `fixtures/manifest.json`.

## License

MIT. See [LICENSE](LICENSE). The fixture shop and journeys are original files in this repository under that license. Playwright is Apache-2.0. `@axe-core/playwright` and axe-core are MPL-2.0 and are used unmodified.
