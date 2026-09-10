# AI Team Workflow

This is the project workflow for an AI team runner. It coordinates work through Beads and keeps implementation and review responsibilities separate.

## Team sequence

1. **Bug triage (when a bug report exists)** — Route the report to the Strict Tester. The tester reproduces it and records a confirmed/not-reproducible/not-a-bug/duplicate outcome with evidence. A confirmed report gets one focused developer task; no task is created for an unconfirmed report.
2. **Plan** — Create or select one Beads issue. Record scope, acceptance criteria, affected states, and validation requirements.
3. **Implement** — Assign the issue to the Senior Angular Developer. The developer reads `AGENTS.md` and this workflow, inspects existing conventions, and makes the smallest complete change.
4. **Self-validate and hand off** — Run the narrowest relevant checks, then the required Definition of Done checks from `AGENTS.md`. Update the Beads issue with changed files and results. When validation passes, automatically post the review request below without asking the user for confirmation. Keep the issue `in_progress`.
5. **Automatic review** — The review-request comment triggers the Strict Code Reviewer automatically, without a user prompt. The reviewer checks the same Beads issue's diff, tests, public API, accessibility, configuration precedence, theming, and dependency changes.
6. **Resolve** — If the reviewer finds a blocker, return the issue to the developer with concrete findings. Repeat validation and review until no blockers remain.
7. **Automatic close** — When review approval and required checks pass, the reviewer automatically comments approval and closes the same Beads issue. No user confirmation is requested. Blockers leave the issue `in_progress` and automatically return findings to the developer.

## Beads commands

```bash
bd ready
bd show <issue-id>
bd update <issue-id> --claim
bd update <bug-report-id> --claim
bd comment <bug-report-id> "Strict Tester triage: outcome=confirmed bug; evidence=...; developer task=<task-id>"
bd create --type bug --title "..." --description "..." --acceptance "..." --label role:senior-angular-developer
bd comment <issue-id> "Implementation complete. Validation: ..."
bd comment <issue-id> "@reviewer please review this task. Implementation and validation are complete; the task remains in_progress until approval."
bd comment <issue-id> "Review complete. Findings: none / ..."
bd close <issue-id> --reason "Reviewed and approved"
```

The implementation agent must execute the review-request comment automatically after successful validation; this is a workflow action, not a prompt for the user. The external AI runner must treat that comment as a trigger to start the Strict Code Reviewer automatically. Replace `@reviewer` with the configured reviewer identity when one is available. Do not close the implementation issue during handoff. The reviewer must automatically run the review checks, post findings, and close the issue with `bd close` when approved. If changes are needed, the reviewer comments on the issue and leaves it `in_progress` for the developer.

The external AI runner must route new bug reports to the Strict Tester before assigning implementation. The tester must not create developer work without a reproducible product defect. A confirmed defect must produce one focused task and link it back to the report; that task then follows the normal implementation and review handoff.

Use dependencies for genuinely separate multi-step work. When implementation and review use the same Beads issue, do not create a second close task solely to represent approval. Keep one independently verifiable behavior per issue when possible.

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
