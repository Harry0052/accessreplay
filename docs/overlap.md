# Overlap review

Access date: 2026-11-23. Decision: **proceed** with a small in-repo journey differential. No existing tool, run here or documented at its current version, accepts one declarative keyboard journey, replays it on two local builds, and names the first failing semantic checkpoint while separating timeout and unsupported observations from an evaluated regression.

The measurable case held constant across probes:

- **Input.** One local shop page. Keyboard sequence only: Tab, type `pen`, Enter, Tab, Enter, Escape, then Tab at most 8 times toward the checkout control.
- **Expected artifact.** An ordered checkpoint list of step, focused node id, role, accessible name, and status text. Rule-engine ids stay beside that list and do not decide the journey verdict.
- **Acceptance metric.** Two replays of the unchanged control produce the same checkpoint list. A missing accessible name, focus left on `document.body` after Escape, and a tab loop that never reaches checkout each show a first divergence at the seeded step. The control has no semantic mismatch.

## Capability matrix

| Capability | Playwright assertions | axe-core | Accessibility Insights FastPass | A11y Journey Evidence | behaviour-checks | Guidepup | AccessForge | AccessReplay MVP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Keyboard steps in a real browser | Yes, authored in a test | No | Assisted manual tab stops | Records native Playwright steps | Operates widgets it discovers | Drives a real screen reader | Not built (Phase 2+) | Declared Tab, Shift+Tab, Enter, Escape, synthetic text |
| Role and accessible name at a checkpoint | `getByRole`, `toHaveAccessibleName` | Rule scan of a DOM state | Automated checks via axe | Focus notes keep tags and attributes, not computed names | Widget state, not a name diff across builds | Spoken phrases, not a browser-name diff | Not built | Checkpoint role and computed name |
| Focus restoration after Escape | Author writes `toBeFocused` | Not a focus-restore check | Manual tab-stop review | Recipe can assert restoration in a test | `toOpenADialogThatHoldsFocus` | Not this comparison | Not built | Expected focus location on the Escape step |
| First failing step across two local builds | No shipped diff of normalized traces | No | No versioned baseline diff | Failure evidence for one test, not a build diff | One page, one matcher | No | Planned Phase 6, not implemented | Normalized trace diff, run ids omitted |
| Missing name with stable selector and similar visible text | Possible if asserted | `button-name` on the empty control | Same axe finding | Not computed | No | Announcement differs only with a real reader | Not built | Name assertion independent of the selector |
| Tab loop bounded by a declared limit | Author loops Tab | No | Manual trap check | Author loops Tab | Modal walk has its own press cap | No | Not built | Stop at the declared tab limit |
| Timeout vs unsupported observation vs regression | Timeouts exist; categories are the author's | Scan errors are scan errors | Needs review is human | Incomplete evidence is separate from assertion result | Timeouts become the same failure as a broken widget | Environment-dependent | Not built | Distinct result states |
| Reject unapproved actions and other origins before the journey finishes | The test can navigate anywhere | No journey | No | The test author chooses keys and URLs | Refuses some unsafe widget presses | No | Not built | Parser and request guard |
| Manual screen-reader run sheet on the same journey | No | No | Separate manual assessment | States it does not run a screen reader | States passing is not conformance | The automation is the reader | Not built | Checklist, unreviewed until a person writes an observation |
| Runs offline on an authored fixture | Yes | Yes | Extension against a loaded page | Yes, inside Playwright Test | Yes | Needs NVDA, VoiceOver, or Orca | Needs Postgres and accounts | Local static fixture only |

## Sources

Versions and licenses were read from npm or the GitHub API on 2026-11-23 unless noted.

| Tool | Primary URL | Version | License | Evidence | What already matches |
| --- | --- | --- | --- | --- | --- |
| Playwright | https://playwright.dev/docs/accessibility-testing and https://github.com/microsoft/playwright | npm `playwright@1.65.1` (Apache-2.0). Docs describe `toHaveAccessibleName`, `toHaveRole`, `toBeFocused`, and ARIA snapshots. Repository pushed 2026-11-22. | Apache-2.0 | Observed run, plus docs | Role, name, and focus assertions inside a test. No cross-build checkpoint report. |
| axe-core and `@axe-core/playwright` | https://github.com/dequelabs/axe-core and https://github.com/dequelabs/axe-core-npm | `axe-core@4.14.1`, `@axe-core/playwright@4.14.0` | MPL-2.0 | Observed run | `button-name` on the unlabeled control. Same rule ids for the control, the focus mutant, and the tab loop, aside from shared landmark noise. |
| Accessibility Insights for Web FastPass | https://accessibilityinsights.io/docs/web/getstarted/fastpass/ and https://github.com/microsoft/accessibility-insights-web | Release `web@2.49.0` published 2026-09-08 (`c58b940`). Repo MIT, 965 stars, pushed 2026-11-03. | MIT | Documentation | Automated axe checks plus an assisted tab-stop test. A person watches focus. It does not emit a versioned diff of two local builds. |
| A11y Journey Evidence | https://github.com/Light2288/a11y-journey-evidence | npm `a11y-journey-evidence@0.1.0`. README: experimental, external validation pending. Peer used by the author: Playwright 1.64.1. | MIT | Documentation | Opt-in evidence bundle around native Playwright tests. Assertions stay in the test. Focus descriptors are tags and attributes, not computed names. Keyboard history omits typed text. |
| `@accessible-by-default/checks` | https://github.com/ThomasSweet/behaviour-checks and https://accessible-by-default.dev/checks/ | npm `0.5.0`. README requires Playwright 1.64 or later. | MIT | Documentation | Keyboard matchers for expanded state, modal focus return, and error association. A dialog walk can report `modal-walk/focus-does-not-return`. It discovers widgets on one page; it does not replay an authored shop journey against a second build. |
| Guidepup | https://github.com/guidepup/guidepup | npm `@guidepup/guidepup@0.40.0`. Repository MIT, 604 stars, pushed 2026-11-08. | MIT | Documentation | Automates NVDA, Orca, or VoiceOver and returns spoken phrases. That is a separate hardware and OS gate. This environment has none of those readers, so it was not executed. |
| AccessForge | https://github.com/TheAlphaEngineerCode/accessforge | `IMPLEMENTATION_STATUS.md` on default branch, accessed 2026-11-23. Phases 0–1 of 13. Apache-2.0 (GitHub license API returned `NOASSERTION`; the LICENSE file is Apache-2.0). | Apache-2.0 | Documentation | Identity, tenancy, and audit only. README: no browser engine, no journey runs, no reports. Phase 5 is the journey engine and Phase 6 is baseline diffing. Quick start needs Postgres and a demo account. Not a license-compatible drop-in for this acceptance case. |

Dataset terms: every comparison above used either no dataset or the original HTML fixture in `docs/research/p01-probe-fixture.html`, written for this review and covered by the repository MIT license. No third-party page, account, or recording was captured.

## Observed probe

Command, from a temporary directory that is not part of the product:

```sh
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --no-fund --no-audit
node probe.mjs
```

Installed `playwright@1.65.1` and `@axe-core/playwright@4.14.0` (pulling `axe-core@4.14.1`). Chromium was not downloaded. The script launched Google Chrome 157.0.8103.50 through Playwright's `channel: 'chrome'` on Linux, Node.js v22.23.4. The page was served on `127.0.0.1` from the shared fixture. Raw output: `docs/research/p01-probe-result.json`.

| Build | First divergence against control | Checkout reached in 8 tabs | axe rule ids after the journey |
| --- | --- | --- | --- |
| control, run A and run B | Traces equal (`controlTracesMatch: true`) | Yes | `landmark-one-main`, `region` |
| `name` | Step `tab-after-1`, same `#place` button, accessible name `""` | Yes, the control is focused | Those two plus `button-name` |
| `focus` | Step `escape`, focus id `body` | Later tabs can still reach the control | Same as control |
| `loop` | Step `tab-after-1`, focus `Offer A` | No, still on the trap after 8 tabs | Same as control |

Reading the focused node's text, label, and `aria-label` was enough for this fixture. Calling `HTMLElement.focus()` on `document.body` inside the dialog `cancel` handler did not leave focus on the body; Chrome restored the control that opened the dialog. Blurring the active element after `close()` did leave focus on the body. The product fixture has to use that second pattern or the seeded fault is not the fault under test.

axe-core saw the missing name and did not see the Escape or tab-loop faults. A one-shot scan of the final DOM is the wrong oracle for this acceptance metric. Plain Playwright can detect all three faults when a test records the same checkpoints and compares them. That comparison, the action allow-list, the origin guard, and the separate timeout and unsupported states are not a Playwright feature. They are the MVP.

## What was not executed

- Accessibility Insights FastPass. It is a Chrome or Edge extension operated by a person. Treating the docs as a passing automated run would overclaim.
- Guidepup and any real screen reader. No NVDA, VoiceOver, or Orca session is available here. Manual observations stay a separate release gate.
- A11y Journey Evidence, behaviour-checks, and AccessForge were not installed. Their READMEs already state the missing behavior, and AccessForge's engine is still a later phase. Installing them would not change the matrix row that blocks the acceptance case.

## Remaining uncertainties

- Playwright's bundled Chromium build for 1.65.1 was not the probe browser. Product runs must install that browser and re-check the dialog focus quirk.
- Accessible-name computation in the probe was a fixture heuristic (label text, `aria-label`, text content). The product should read the browser accessibility tree so a name that disagrees with visible text is still the browser's name.
- FastPass partial automation can flag some tab-stop issues. That does not produce the normalized two-build artifact, and it was not observed.
- MPL-2.0 axe-core is usable as an unmodified library next to MIT and Apache-2.0 code. Modifications of axe source are out of scope.

## Decision

**Proceed.** Contribute keyboard assertions to an existing Playwright suite only if the maintainer wants those tests. That does not give an accessibility engineer a journey file, a control-versus-mutant report, and a screen-reader sheet they can run without writing the harness. AccessForge is the nearest product vision and its journey engine does not exist yet; waiting on Postgres, accounts, and ten phases is a different project. Guidepup remains the right later option for an optional real screen-reader probe, outside this MVP's automated gate.

The hypothesis worth testing: a checkpointed keyboard trace with browser-computed role and name will flag every seeded checkpoint and name the first failing step, with zero semantic failures on the identical control, where a single axe scan reports only the missing name.
