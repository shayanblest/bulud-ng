# AI development guide

## Before work

1. Read `AGENTS.md` and the applicable `.agents/` role contract.
2. Check the working tree and preserve unrelated user changes.
3. Inspect the target feature, public API, tests, demo, and relevant docs.
4. Check Beads for existing tasks, duplicates, dependencies, epics, and blocked work.
5. For a new component or feature, complete the required audit gate before implementation.

## During work

- Keep one independently verifiable behavior per task and one focused PR per task.
- Prefer the smallest complete change; do not mix cleanup with feature behavior.
- Keep public exports intentional and test configuration precedence explicitly.
- Add unit tests with the behavior. Add demo and Playwright coverage when markup, states, or theming changes.
- Use semantic HTML and define keyboard/focus behavior before styling.
- Preserve the existing Angular, signals, OnPush, zoneless, strict TypeScript, and npm conventions.

## Browser validation

- `npm run test` runs the unit suite once in headless Chromium.
- Override the browser location with `CHROME_BIN=/path/to/chromium` when the
  default `/snap/bin/chromium` path is unavailable.
- `npm run e2e` runs Playwright in headless Chromium by default.

## Handoff loop

1. Run the narrowest relevant checks and every applicable Definition of Done check.
2. Request local Beads review before committing or pushing.
3. For requested changes, fix the same worktree, rerun tests/E2E, and request re-review.
4. After Beads approval, close the task, create exactly one commit, push the task branch, and open a GitHub PR.
5. Keep the PR at exactly one commit; post-publication fixes reopen the task and use amend plus `git push --force-with-lease`.

## Required handoff evidence

Include:

- concise summary and scope;
- changed files and public API/dependency impact;
- branch and PR URL;
- each validation command with an individual pass/fail result;
- known risks, unresolved questions, and out-of-scope observations;
- links to review findings and their resolutions.

## Safe operating rules

- Do not delete issues, branches, files, or history without explicit authorization and a verified target list.
- Do not use broad destructive commands or overwrite unrelated work.
- Do not claim a check, review, sync, or merge that was not actually observed.
- Treat Beads as the canonical source for issue status, labels, dependencies, epics, and task history.
- If GitHub, Beads, credentials, or CI is unavailable, record the exact blocker and leave work open.
