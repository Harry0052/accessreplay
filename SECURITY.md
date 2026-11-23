# Security

AccessReplay reads a local journey file and serves a local fixture to headless Chromium. It has no accounts and it does not send journey contents to a service.

## Reporting

Report a vulnerability through a private GitHub security advisory on this repository:

https://github.com/Harry0052/accessreplay/security/advisories/new

Please do not file a public issue that includes an exploit. The advisory can describe the affected version, the fixture or journey input, and the impact.

## Scope

In scope: journey parsing, the local fixture server, origin checks, report paths, and the Chromium runner in this repository.

Out of scope: vulnerabilities in a website you point the tool at, screen-reader products, and the Playwright or axe-core projects themselves. Those projects have their own reporting routes. This tool is only supported against the in-repo fixture.
