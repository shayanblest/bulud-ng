# Alert palette correction — 2026-10-21

## Summary
Corrected actual bulud-ng alert colors against Angour components/_alerts.scss
and light/dark palette maps. Existing 25% generic text blending had muted all
semantic colors; dark danger had incorrectly used danger-text for border and
background. Light/dark variants used border/text gray instead of Angour's
inverted white/black palette. Brand fills were also incorrectly fixed at 10%.

## Files changed
- projects/bulud-ng/feedback/feedback.scss: distinct tone/emphasis, exact semantic
  borders/icons, 10% semantic fills, 20%/25% brand fills, 10%/20% light/dark fills,
  21% hover fill. Keep typed foreground/background/border overrides highest.
- tools/generate-angour-theme.mjs and projects/bulud-ng/angour.css: generated
  brand/neutral alpha CSS tokens per mode (explicit theme CSS remains opt-in).
- e2e-base/skeleton-alert.spec.ts: assert Angour RGB per variant, composited fill
  alpha/channel values and text contrast, alongside existing interaction cases.

## Validation
- format:check: PASS.
- lint: PASS, no errors.
- actual focused feedback/shared-theme unit suite: PASS, 27 tests.
- focused Playwright: PASS, 4 cases covering fa/en, light/dark. Tests the eight
  Angour palette variants exactly; neutral remains an additional Bulud variant.
  All nine variants retain normal-text contrast >=4.5 on the default surface.
- actual production app build: PASS, 299.70 kB initial, below 300 kB cap.
- actual library build/npm pack: PASS, 128 packed files.
- actual validate:package: PASS, 168 emitted files.
- Four transferred source files verified byte-for-byte against tested source.
- CUA visual review: PASS on actual 4310 in both themes; screenshots:
  /tmp/bulud-alert-colors-light.jpg and /tmp/bulud-alert-colors-dark.jpg.
- Public TypeScript API: unchanged; no dependency/lockfile changes by this task.

## Risks / unresolved issues
Readable text emphasis is adjusted where the original Angour palette would
provide insufficient contrast (especially amber, dark purple and dark secondary).
The semantic hue is retained; borders, icons and fill use original palette RGB.
Custom consumer color overrides remain the consumer's contrast responsibility.
No public npm publication or new Lighthouse score claimed.

## Out of scope
No unrelated component refactoring or release identity/license changes.
