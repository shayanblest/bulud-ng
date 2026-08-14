# AI Team Workflow

This is the project workflow for an AI team runner. It coordinates work through Beads and keeps implementation and review responsibilities separate.

## Team sequence

1. **Plan** — Create or select one Beads issue. Record scope, acceptance criteria, affected states, and validation requirements.
2. **Implement** — Assign the issue to the Senior Angular Developer. The developer reads `AGENTS.md` and this workflow, inspects existing conventions, and makes the smallest complete change.
3. **Self-validate** — Run the narrowest relevant checks, then the required Definition of Done checks from `AGENTS.md`. Update the Beads issue with changed files and results.
4. **Review** — Assign the completed work to the Strict Code Reviewer. The reviewer checks the diff, tests, public API, accessibility, configuration precedence, theming, and dependency changes.
5. **Resolve** — If the reviewer finds a blocker, return the issue to the developer with concrete findings. Repeat validation and review until no blockers remain.
6. **Close** — Close the Beads issue only after review approval and required checks pass.

## Beads commands

```bash
bd ready
bd show <issue-id>
bd update <issue-id> --claim
bd comment <issue-id> "Implementation complete. Validation: ..."
bd comment <issue-id> "Review complete. Findings: none / ..."
bd close <issue-id>
```

Use dependencies for multi-step work: the review task must depend on implementation, and the close/handoff task must depend on review. Keep one independently verifiable behavior per issue when possible.

## Handoff contract

Every handoff must include:

- issue ID and concise scope;
- files changed;
- public API, dependency, markup, state, or theming impact;
- validation commands and pass/fail results;
- known risks and reviewer questions.

## Review gate

The reviewer must report findings by severity and cite files/lines. Any correctness, accessibility, public API, configuration-precedence, required-test, or build failure is a blocker. Suggestions may remain open only when they do not affect the requested behavior or project requirements.

## Safety rules

- Never let an agent modify another agent's unrelated work.
- Never close an issue based only on a passing unit test when E2E coverage is required.
- Do not add dependencies, change public exports, or alter shared configuration without explicitly recording it in the handoff.
- Markdown role files define responsibilities; the external AI runner is responsible for spawning agents and enforcing this sequence.

