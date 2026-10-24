# Skeleton and alerts validation — 2026-10-21

Implemented in the actual `/home/fatemeh-shirazi/Desktop/bulud-ng`, not only staging.
27 changed/added files verified byte-for-byte against the tested staging source.
Root package.json and package-lock.json unchanged by this task.

## Features

- Angour line/circle/thumbnail/card skeleton, bounded 1–12 lines, CSS-only shimmer,
  static/reduced-motion/forced-colors states and opt-in localized announcement.
- Existing BuludAlert extended to nine semantic/brand kinds, optional title/icon,
  action projection, thin rounded border/tinted background, localized dismiss and
  safe text. Existing notice store/outlet retained.
- Controlled confirmation/creation/rejection component built on existing native
  dialog/button, initial cancel focus, Escape cancellation, focus restoration and
  async processing guard. No business service or extra dependency.
- Shared theme global/component/instance precedence; separate npm entries.
- Three lazy localized catalog pages, live examples, code/API and sidebar links:
  /components/skeleton, /components/alert, /components/confirm.

## Evidence

- Actual full Karma/Chrome suite: 705 passed (/tmp/skeleton-actual-units.log).
- Scoped new/feedback/shared-theme suite: 36 passed.
- Staging full base Playwright regression: 59 passed (/tmp/skeleton-e2e.log).
- After visual contrast refinement, four focused browser cases passed
  (/tmp/skeleton-contrast.log). Includes all nine alert text contrast >=4.5 in
  Persian/English and light/dark, reduced motion, dismissal, dialog Escape,
  focus restoration, processing disabled actions and completion recovery.
- Staging lint passed. Every transferred source matches tested source bytes.
- Actual browser 4310 manually verified skeleton, light/dark alerts and rejection
  confirmation; localized cancel returns focus. Screenshots in /tmp:
  bulud-skeleton-preview.jpg, bulud-alert-preview.jpg,
  bulud-alert-dark-preview.jpg, bulud-confirm-preview.jpg.
- Actual production app build passed: initial 299.49 kB, below existing 300 kB
  cap; all three added pages lazy loaded. No initial JS increase.
- Actual library build/npm pack and validate:package passed: 168 emitted files,
  128 packed files. Local tarball dist/packages/bulud-ng-0.0.1.tgz.
- Packed independent consumer validation passed: all 40 JS entry declarations
  with skipLibCheck=false, four CSS exports and seven optimized AOT fixtures
  (button, donut, period, chat, number pipe, skeleton, confirm). Selected-only
  imports exclude unrelated component markers. /tmp/skeleton-tree.log.

No public npm publication. Prior release identity/license and historical release
review gates remain separate from this feature verification. No Lighthouse
score is claimed for this task.
