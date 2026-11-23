# Contributing

Issues and changes are welcome. The maintained path is a git checkout on Node.js 22.

```sh
npm ci
npx playwright install chromium
npm run check
npm test
node cli.mjs demo
```

Keep fixtures synthetic. Do not add personal data, credentials, key logs from a real session, or copies of a third-party site. New fixture files belong in `fixtures/manifest.json` with their sha256. The manual screen-reader sheet stays `unreviewed` unless the observation includes the reader, operating system, and version.

Browser role and name checks are not a claim about screen-reader speech. Say that in any new report text.

There is no hosted service to configure.
