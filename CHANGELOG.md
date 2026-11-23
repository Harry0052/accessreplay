# Changelog

## 0.1.0

First release of the fixture journey runner.

- Replay a declared keyboard journey in Chromium and compare role, accessible name, focus, status text, and app state with run ids omitted.
- Seeded shop builds for a missing accessible name, focus left on the document body after Escape, a tab loop, an application timeout, an unsupported speech observation, and a wrong-origin redirect.
- `node cli.mjs demo` writes `reports/demo/summary.html` and `reports/demo/summary.json`. The manual screen-reader sheet ships unreviewed.
- Reject unapproved actions and external URLs before a browser starts.
