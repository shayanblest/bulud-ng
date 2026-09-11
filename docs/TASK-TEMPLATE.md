# Task and PR template

Use this template when converting a PRD item into an independently verifiable
Beads task. GitHub Issue fields are optional mirror metadata.

```markdown
# <type>: <concise title>

## Outcome
<User-visible result.>

## Scope
<One focused behavior or change.>

## Labels
- `type:<feature|bug|task|docs|audit>`
- `area:<component-or-system>`
- `priority:P0|P1|P2|P3`
- `role:<assigned-role>`

## Dependencies
- Blocks: <task IDs, only genuine blockers>
- Parent epic: <epic ID, or none>
- GitHub Issue mirror: <URL, or none>

## Acceptance criteria
- [ ] <Observable criterion>
- [ ] <Observable criterion>

## States and edge cases
- <Applicable component states and boundaries>

## Validation
- [ ] Unit: <focused command and behavior>
- [ ] E2E/demo: <required command and states, or N/A with reason>
- [ ] Format/lint/build: <required commands>
- [ ] API/dependency diff reviewed

## Out of scope
- <Explicit exclusions>

## Handoff
- Branch: <branch>
- PR: <URL>
- Beads: <canonical issue ID>
- Commit count: exactly 1
- Risks: <known risks>
```

Use an epic only when multiple child tasks share a product outcome. Keep child
tasks independently implementable, label them consistently, and define only
real dependency edges.
