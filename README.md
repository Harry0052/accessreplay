# AccessReplay

Replay one keyboard journey against a local fixture shop and name the first step where focus, role, accessible name, or status text changed.

Version 0.1.0 is a local tool for accessibility and QA engineers. It does not certify conformance, log into a site, or record a screen reader. Browser evidence and manual speech observations stay separate.

## Supported toolchain

Tested platform: Node.js 22 on Linux x86_64 with Playwright's Chromium. The commands below are the supported setup. macOS and Windows were not measured for this release.

- Node.js 22 and npm 10
- Playwright 1.65.1 and its Chromium build
- No paid service, account, or network access while the demo runs

## Install

From a clean checkout:

```sh
npm ci
npx playwright install chromium
```

`npm ci` installs the locked Node packages. `npx playwright install chromium` downloads Playwright's Chromium into the local Playwright cache. After that, the demo serves only `fixtures/shop` on `127.0.0.1`.

## Demo

```sh
node cli.mjs demo
```

Expected result: exit 0. Stderr names the keyboard sequence and these outcomes:

- `control: pass`
- `focus-mutant` fails at `escape-cart`. Expected focus is `#add-pen` ("Add pen"). Observed focus is `#body`.
- `name-mutant` fails at `reach-checkout`. Expected name is `Place demo order.`. Observed name is empty. The selector stays `#place`.
- `tab-loop` fails at `reach-checkout` because checkout is not reached in 8 tabs.
- `timeout` is an application timeout, not a semantic regression.
- `unsupported` records the search box and does not score speech as a regression.
- `redirect` is rejected because the page requests `https://example.com`.

The manual sheet state is `unreviewed`.

Reports:

- Human summary: `reports/demo/summary.html`
- Machine summary: `reports/demo/summary.json`
- One trace per build: `reports/demo/<build>.json`

Stdout is the JSON summary. Stderr is the explanation. The normalized trace omits run ids. A run on this release host finished in about 11 seconds. The checked budget is 90 seconds.

The screen-reader sheet is a separate gate. It lists announcements to verify and stays unreviewed until someone records the reader, operating system, and version in `fixtures/observations/manual.json`. The demo does not drive NVDA, VoiceOver, or Orca.

## Other commands

```sh
npm run check
npm test
node cli.mjs validate fixtures/journeys/checkout.journey.json
node cli.mjs run --journey fixtures/journeys/invalid-action.journey.json --build control --out reports/run
```

`npm test` includes the demo. Validation of the checkout journey exits 0. The invalid journey uses `click` and exits 2 before Chromium starts. The message lists the approved actions: tab, shiftTab, enter, escape, and type.

Input and output shapes are in `docs/schema.md`. The hand-traced control oracle is `fixtures/oracle/checkout-control.md`. Measurements are in `docs/validation.md`.

## Fixture terms

The shop, journeys, and observations are original files in this repository under the MIT license. There is no third-party dataset. Checksums and the no-network rule are in `fixtures/manifest.json`. Do not add personal data, credentials, or captures from real sites.

## License and notices

MIT. See [LICENSE](LICENSE). Dependency licenses and attribution are in [NOTICE.md](NOTICE.md). Changes are in [CHANGELOG.md](CHANGELOG.md).

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).
