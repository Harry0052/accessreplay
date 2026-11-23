# Project contract

Decision carried forward from `docs/overlap.md`: proceed. AccessReplay is a local keyboard-journey differential for one fixture shop. It is not a conformance certificate and it does not automate a screen reader.

## User and task

An accessibility or QA engineer regression-tests one essential workflow in a web application they maintain. In version one that application is the in-repo fixture shop. The engineer runs a declared keyboard journey against an identical control and against a changed build, then reads the first checkpoint where focus, role, accessible name, focus restoration, or visible status text diverged.

## Minimum dependencies

| Dependency | Version pin | License | Why it is required |
| --- | --- | --- | --- |
| Node.js | 22.x, the runtime used in this workspace (v22.23.4) | Node.js license | ES modules, `node:test`, `node:http` |
| playwright | 1.65.1 | Apache-2.0 | Chromium, keyboard, accessibility tree |
| @axe-core/playwright | 4.14.0 | MPL-2.0 | Supplemental scan beside a checkpoint. Pulls axe-core 4.14.1, also MPL-2.0 |

No paid service, account, or network fetch at run time. The fixture and journeys are original files in this repository under the MIT license. Playwright's Chromium build is installed from the Playwright CDN during setup and is not required again once cached. Guidepup, Accessibility Insights, and AccessForge are comparison points, not dependencies.

## Measurable acceptance case

Replay `fixtures/journeys/checkout.journey.json` on `fixtures/shop/control` twice. The normalized checkpoint traces are equal after run ids, timestamps, ports, and axe details are omitted, and every checkpoint passes.

On the seeded builds, the first failing step is:

| Build | First failing step | Result category |
| --- | --- | --- |
| `name-mutant` | The checkout control checkpoint. Selector `#place` still matches. Visible text still reads `Place demo order.` Accessible name does not. | `evaluated_regression` |
| `focus-mutant` | The Escape step. Focus is the document body. The report names the expected control (`#cart`, accessible name `Cart`). | `evaluated_regression` |
| `tab-loop` | The bounded tab toward `#place`. Checkout is not reached within the declared tab limit. | `tab_limit` |
| `timeout` | No semantic comparison. The app never becomes ready. | `application_timeout` |
| `unsupported` | The step whose target exposes no browser accessibility node. | `unsupported_observation` |

Unapproved actions, external navigation, and a redirect off the fixture origin fail before the journey is treated as a completed comparison (`unapproved_action`, `external_navigation`, `wrong_origin`).

Manual screen-reader checks are a separate gate. The report lists expected announcements as observations to verify and leaves them `unreviewed` until a person records the reader, operating system, and version.

## Out of scope

Remote websites, real accounts, passwords, keystroke capture outside the declared synthetic text, Firefox and WebKit, conformance scoring, and any claim that browser semantics equal screen-reader speech.

## Integration recommendation

Do not block this repository on AccessForge or A11y Journey Evidence. Use Playwright and axe-core as libraries. Revisit Guidepup only as an optional, separately verified assistive-technology probe.
