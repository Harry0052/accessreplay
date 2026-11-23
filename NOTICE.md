# Notices

AccessReplay is original code under the MIT license in `LICENSE`. The fixture shop, journeys, and manual sheet are original and have no upstream dataset.

Unmodified runtime dependencies:

| Package | Version | License | Source |
| --- | --- | --- | --- |
| playwright | 1.65.1 | Apache-2.0 | https://github.com/microsoft/playwright |
| @axe-core/playwright | 4.14.0 | MPL-2.0 | https://github.com/dequelabs/axe-core-npm |
| axe-core | 4.14.1 | MPL-2.0 | https://github.com/dequelabs/axe-core |

axe-core is used as a supplemental scan. Its source is not modified. Playwright's Chromium build is downloaded by `npx playwright install chromium` during setup and is not vendored in this repository.

Comparison notes in `docs/overlap.md` name other projects. Those projects are not included in this tree.
