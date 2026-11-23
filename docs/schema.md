# Journey and report schema 1.0.0

Units: timeouts are milliseconds. Journey size is bytes of the UTF-8 file. Text limits are JavaScript string length (UTF-16 code units). Tab limits count `Tab` key presses.

## Input

A journey is a JSON object, at most 65536 bytes, with no byte-order mark and no string that contains a URI scheme (`http:`, `https:`, `javascript:`, `file:`, and any other `scheme:` form).

| Field | Values |
| --- | --- |
| `schemaVersion` | `"1.0.0"` |
| `fixtureLabel` | Lowercase id, 1–64 characters |
| `id` | Lowercase id, 1–64 characters |
| `title` | 1–140 characters |
| `limits.maxSteps` | Integer 1–40 |
| `limits.stepTimeoutMs` | Integer 100–10000 milliseconds |
| `limits.readyTimeoutMs` | Integer 100–10000 milliseconds |
| `limits.maxInputChars` | Integer 1–80 characters |
| `limits.maxTabsToTarget` | Integer 1–30 tabs |
| `ready` | `{ "attribute": "data-app-ready", "equals": "true" }` |
| `steps` | 1 to `maxSteps` objects. Step ids are unique |

Approved `action.type` values are `tab`, `shiftTab`, `enter`, `escape`, and `type`. Anything else is `unapproved_action` and the journey does not start.

`type` carries `text` matching `^[A-Za-z0-9 .]+$` and no longer than `maxInputChars`. `tab` is one press unless both `untilFocusId` and `maxTabs` are set. `maxTabs` cannot exceed `limits.maxTabsToTarget`.

`expect` carries `role`, `name`, `focusId`, `liveRegion`, and `appState`. `focusId` is an element id or `body` when the active element is the body or the document element. `observation` is `browser-semantics` (default) or `screen-reader-announcement`. The second one is recorded and is not scored as a regression, because the browser tree does not prove speech.

Build ids used by the runner are lowercase names of directories under `fixtures/shop/`. `..` is rejected.

## Output

| Field | Meaning |
| --- | --- |
| `status` | `pass`, `fail`, `timeout`, `unsupported`, or `rejected` |
| `category` | null, or one error category below |
| `firstFailingStep` | Step id, or null when the run never scored a step |
| `checkpoints` | One object per completed step, including expected, observed, result, and supplemental axe rule ids |
| `normalizedTrace` | `stepId`, `action`, `role`, `name`, `focusId`, `liveRegion`, `appState`, `result` |

The normalized trace omits `runId`, timestamps, durations, ports, page URLs, and axe rule ids. Two passes of an unchanged build compare equal on that trace.

## Error categories

| Category | When | Exit |
| --- | --- | --- |
| `invalid_fixture` | Malformed JSON, extra properties, out-of-range limits, oversized file | 2 |
| `unapproved_action` | Action is not one of the five approved keys | 2 |
| `external_navigation` | A URI scheme appears in the journey | 2 |
| `wrong_origin` | The page navigates or requests a host other than the local fixture | 2 |
| `application_timeout` | `data-app-ready` is not `true` within `readyTimeoutMs`, or a step exceeds `stepTimeoutMs` | 3 |
| `unsupported_observation` | The step asks for a screen-reader announcement | 4 |
| `evaluated_regression` | Role, name, focus, live region, or app state disagrees with the journey | 1 |
| `tab_limit` | `untilFocusId` was not reached within `maxTabs` | 1 |

`tab_limit` is a failed journey (`status` `fail`) with its own category so a loop is not described as a wrong name. Axe findings never change `status`.
