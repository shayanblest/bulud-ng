# Remote PR review checklist

Use the Beads task as the review workflow and communication record. Use the
pushed GitHub PR only as the source of truth for the code diff, CI result, and
merge status. GitHub Issues are optional mirrors and are not review records.

## Before approval

- [ ] PR is open and mergeable.
- [ ] PR contains exactly one commit.
- [ ] CI reports all required checks passing.
- [ ] Diff is limited to the requested scope.
- [ ] Public API and dependency changes are intentional.

## Defect review

- [ ] Correctness, edge cases, and reactive updates are sound.
- [ ] Angular standalone, typed, OnPush, and zoneless rules are satisfied.
- [ ] Semantic HTML, accessible names/roles/states, keyboard behavior, and focus management are correct.
- [ ] Forms behavior and validation are correct where applicable.
- [ ] Configuration precedence and all theme override levels are tested.
- [ ] RTL, light/dark, locale, disabled/loading/empty/error states are covered where applicable.
- [ ] Unit, demo, E2E, documentation, and build coverage match the changed behavior.
- [ ] Performance, cleanup, SSR/browser guards, and bundle impact are acceptable.

## Findings loop

- Record each required change in the Beads task as an actionable finding with severity and file/line evidence. Copy it to the GitHub PR only when useful for line context.
- Explicitly tell the developer what must be fixed.
- Leave the PR and Beads task open. A mirrored GitHub Issue, if present, is secondary.
- Re-review the same PR after the developer amends the single commit and force-pushes with `--force-with-lease`.
- Approve only when every required finding is resolved and CI is green.
- Close the Beads task only after the PR is confirmed merged; close an optional GitHub Issue mirror afterward.
