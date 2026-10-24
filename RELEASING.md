# Publishing Bulud NG

Publish the built Angular package (`dist/bulud-ng`), never the private workspace.
Do not treat a successful build or npm pack as authorization to publish.

## Owner decisions still required

- Final package name/scope and the npm account that owns it. Check availability
  with `npm view <chosen-name> name version` and account access with `npm whoami`.
- If changing the package name/scope, update internal self-imports, TypeScript
  aliases, documentation and consumer fixtures together, then rebuild and rerun
  the installed-consumer tests. Changing only package.json is insufficient.
- Choose a license and provide its complete text as
  `projects/bulud-ng/LICENSE`. Set its SPDX identifier in the library manifest.
  No license is assumed by this repository. `LICENSE*` assets are packaged.
- Confirm the release version, repository/support URLs and maintainer metadata.
- Review the current public API and dependency-contract diff against the PR base.
  Existing exact-change approvals in tools/release-approvals.json require real
  review; never replace a baseline with the current state just to pass a check.
  CSS sideEffects retention is intentional; do not set it to false to silence
  the historical dependency gate.

## Validate the release candidate

```bash
npm ci --ignore-scripts
npm run format:check
npm run lint
npm audit --omit=dev
CHROME_BIN=/usr/bin/google-chrome npm run test
node --test tools/*.test.mjs
npm run build:base
node tools/measure-base.mjs
npm run build:demo
npx playwright test --config playwright.base.config.ts
npm run e2e
npm run package:local
npm run validate:package
npm run validate:smoke
npm run validate:tree-shaking
node tools/verify-server-consumer.mjs 20.3.34
npm run validate:api
npm run validate:deps
```

Run browser servers on free isolated ports. The legacy Playwright configuration
uses 4200; do not allow its reuseExistingServer option to target an unrelated
running application. The current catalog uses 4313 for tests.

Confirm that `angour.css` is reproducible with
`node tools/generate-angour-theme.mjs` and inspect the diff. Source configuration
and built peers/exports must match. CI covers browser, package, tree-shaking and
server consumer checks; API/dependency review failures remain real blockers.

## Final local preflight after metadata and license are supplied

```bash
npm run package:local
node dist/bulud-ng/publish-check.mjs
npm publish ./dist/bulud-ng --dry-run --access public
```

The local prepublish guard requires compiled exports and a nonempty license
asset, rejects private manifests and consumer install hooks, and leaves normal
`npm pack` available for local testing. Inspect the tarball file inventory,
peer ranges and all required CSS/documentation/license assets.

Only after review, registry ownership and explicit publication authorization:

```bash
npm publish ./dist/bulud-ng --access public
```

Use npm's normal account/2FA or trusted publishing flow. Never save tokens in the
repository, source package, demo or validation report. No publish automation is
created until the owner configures the release identity and workflow.
