# Pagination icon direction fix — 2026-10-21

## Summary

Unicode chevrons were mirrored twice in RTL: once by the bidi algorithm and
once by the component transform. Isolate their text in LTR so the explicit
transform follows only the nearest effective host direction. RTL previous now
points right and next points left; LTR previous points left and next right.

## Files changed

- `projects/bulud-ng/pagination/bulud-pagination/bulud-pagination.scss` — isolated LTR icon text.
- `projects/bulud-ng/pagination/bulud-pagination/bulud-pagination.spec.ts` — nested direction regression coverage.
- `e2e/pagination.spec.ts` — both directional icons in LTR before toggling RTL.

## Validation

- Format script: PASS; changed source/tests also formatted with Prettier.
- Lint: PASS, zero errors.
- Scoped headless Chrome units: PASS, 16/16.
- Pagination browser suite: PASS, 4/4; includes RTL, light/dark, keyboard, disabled, bounds and narrow overflow.
- Library build: PASS.
- Public API diff for this fix: none.
- Dependency diff for this fix: none.
- Delivery: original file hashes checked before transfer to preserve concurrent changes.

## Risks / unresolved issues

None identified for this change. Existing full-suite focus failures recorded in
previous reports were outside this scoped change.

## Out of scope

No unrelated components, application direction preferences, dependencies or exports changed.
