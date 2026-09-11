# AI Team Workflow

This is the project workflow for an AI team runner. It coordinates work through Beads and keeps implementation and review responsibilities separate.

## Team sequence

0. **Audit gate (current priority)** — Before building new components or features, audit every existing component against the checklist in `AGENTS.md` §7. Produce one row per component, create separate focused Beads tasks for gaps ordered by risk (accessibility and configuration precedence first), and do not bundle unrelated fixes into the audit. The audit itself is complete only when the report and task links are recorded.
1. **Product intake (for a new feature/component request without an issue ID)** — Route the request to the Technical Product Manager. The manager produces a clean, implementation-ready PRD with scope, requirements, acceptance criteria, risks, and validation expectations. Issue creation, prioritization, labeling, assignment, and tracker synchronization happen only in a later workflow step, if requested.
2. **Bug triage (when a bug report exists)** — Route the report to the Strict Tester. The tester reproduces it and records a confirmed/not-reproducible/not-a-bug/duplicate outcome with evidence. A confirmed report gets one focused developer task; no task is created for an unconfirmed report.
3. **Plan** — Select the PM- or tester-created Beads issue and confirm scope, acceptance criteria, affected states, dependencies, and validation requirements. For audit-created tasks, link the relevant component row and audit finding.
4. **Implement** — Assign the issue to the Senior Angular Developer. The developer reads `AGENTS.md` and this workflow, inspects existing conventions, and makes the smallest complete change.
5. **Self-validate and request Beads review** — Run the narrowest relevant checks, then every applicable Definition of Done check from `AGENTS.md`. Update the Beads issue with changed files, public API/dependency impact, and pass/fail results. Before creating a commit, push, or PR, comment on the Beads issue requesting the Strict Code Reviewer to inspect the current local worktree. No GitHub publication is allowed yet.
6. **Resolve local review requests** — The reviewer records findings in Beads and tells the developer what to fix. The developer makes the fixes in the same task worktree, reruns all applicable validation including E2E, and requests another Beads review. Repeat until every required change is resolved. Do not commit or push review iterations.
7. **Approve, close, and publish** — After applicable E2E passes and the Strict Code Reviewer records approval in Beads, close the Beads task. Only then create exactly one implementation commit, push the task branch, and create the GitHub PR. The PR is a publication and CI record; it is not the approval gate. Do not create a PR or push before Beads approval and closure.
8. **Post-publication corrections** — If CI or a post-publication check finds a problem, reopen the Beads task, fix the same branch, amend the single commit, and force-push with `git push --force-with-lease`. Request Beads re-review before any further closure; never add a second commit.

## Beads commands

```bash
bd ready
bd show <issue-id>
bd create --type feature --title "..." --description "..." --acceptance "..." --label role:senior-angular-developer
bd update <issue-id> --claim
bd update <bug-report-id> --claim
bd comment <bug-report-id> "Strict Tester triage: outcome=confirmed bug; evidence=...; developer task=<task-id>"
bd create --type bug --title "..." --description "..." --acceptance "..." --label role:senior-angular-developer
bd comment <issue-id> "Implementation complete. Validation: ..."
bd comment <issue-id> "@reviewer please review the current local worktree using .agents/strict-code-reviewer.md. Implementation and validation are complete; do not push or create a PR before approval."
bd comment <issue-id> "Review complete. Findings: none / ..."
bd close <issue-id> --reason "E2E passed and local Beads review approved; publish after closure"
```

## Beads as the main issue manager

Beads is the canonical issue manager for this project. It owns issue identity, titles, descriptions, acceptance criteria, labels, priorities, epics, dependencies, assignments, workflow state, comments, and closure. GitHub is the source of truth for pull-request code review, CI, and merge history. GitHub Issues are optional mirrors, not a second task manager.

- Create and update the Beads task first. The Beads ID is the primary task reference for every handoff, branch, PR, review, and report.
- Use `bd blocked`, `bd ready`, `bd search`, and `bd show` before creating or selecting work. Use Beads labels, epics, priorities, dependencies, and state transitions rather than GitHub Issue fields for planning.
- If GitHub Issue mirroring is enabled or explicitly requested, create at most one mirror per Beads task and record the cross-reference in both records. Never create a GitHub Issue instead of a Beads task.
- Keep the concise scope, acceptance criteria, publication PR URL (after closure), validation results, review findings, and publication reference in Beads as the primary task history. Mirror them to GitHub only when an optional Issue mirror exists.
- Every PR must include the Beads ID. Add a GitHub Issue reference only when a mirror exists, for example `Beads: <issue-id>` and `Fixes #<github-issue-number>`.
- When a reviewer requests changes, keep the Beads task open/in progress and link the same PR revision. When the developer pushes an amended commit, update Beads and the same PR rather than creating a new task.
- Local Beads reviewer approval plus a passing applicable E2E result is the closure gate. Close the Beads task before publishing the approved commit to GitHub. A later PR merge is publication history, not a prerequisite for this task closure flow.
- If synchronization fails, the Beads task remains authoritative and open; record the failure and unsynchronized fields in Beads, then retry the optional GitHub mirror. Never silently claim that records are synchronized.

Example commands for the external runner:

```bash
gh issue create --title "[Beads <issue-id>] ..." --body "Beads: <issue-id>\n\nScope: ...\nAcceptance: ..."
gh issue comment <github-issue-number> --body "Beads update: ..."
gh issue close <github-issue-number> --comment "Merged PR #<pr-number>; merge commit <sha>."
```

The implementation agent must validate the local worktree and comment on the Beads issue requesting review before creating a commit, pushing, or creating a PR. The external AI runner must treat that comment as a trigger to start the Strict Code Reviewer automatically. Replace `@reviewer` with the configured reviewer identity when one is available. The reviewer inspects the local worktree, records findings in Beads, and tells the developer what to fix. When applicable E2E passes and no blockers remain, the reviewer records approval and closes the Beads task. Only after closure may the developer create exactly one commit, push it, and create the GitHub PR. Any post-publication correction reopens the task; the developer amends the same commit and force-pushes only after the correction is reviewed again in Beads.

The external AI runner must route new bug reports to the Strict Tester before assigning implementation. The tester must not create developer work without a reproducible product defect. A confirmed defect must produce one focused task and link it back to the report; that task then follows the normal implementation and review handoff.

The external AI runner must route feature and component requests without an issue ID to the Technical Product Manager. The manager returns the PRD before any later issue creation or implementation routing. The PRD must remain understandable and actionable without a tracker record.

Use dependencies for genuinely separate multi-step work. When implementation and review use the same Beads issue, do not create a second close task solely to represent approval. Keep one independently verifiable behavior per issue when possible.

## Required task report

Every completed implementation, review, and audit must include this report in the handoff comment or final project report:

```markdown
## Summary
1-3 sentences.

## Files changed
- path — what changed

## Validation
- format / lint / tests / e2e / build: pass/fail (counts where relevant)
- public API diff: none | list
- dependency diff: none | list (pending approval)

## Risks / unresolved issues
## Out of scope (noticed, not done)
```

For an audit, replace “Files changed” with the component audit table when no files were changed, and include links to each follow-up task.

## Handoff contract

Every handoff must include:

- issue ID and concise scope;
- GitHub branch name and pull-request URL;
- files changed;
- public API, dependency, markup, state, or theming impact;
- validation commands and pass/fail results;
- known risks and reviewer questions.

## Review gate

The reviewer must report findings by severity and cite files/lines. Any correctness, accessibility, public API, configuration-precedence, required-test, E2E, or build failure is a blocker. Required findings must be actionable and addressed to the developer. Do not approve while any required finding remains unresolved; after fixes are pushed, review the updated GitHub PR again.

The reviewer must use the Beads task as the review workflow and communication record, and the local worktree as the source of truth for pre-publication review. GitHub is used only after Beads closure for the pushed diff and CI/publication history. GitHub Issues must not be used as the review task or approval record.

Every implementation PR must contain exactly one commit. Reviewers must treat additional commits as a process blocker and ask the developer to squash them into the implementation commit before approval. The developer must amend the existing commit and use `git push --force-with-lease` for all review-driven updates.

## Safety rules

- Never let an agent modify another agent's unrelated work.
- Never close an issue without recorded Beads reviewer approval and a passing applicable E2E test. Unit/build success alone is insufficient. Never push or create a PR before the task is closed through that gate.
- Do not add dependencies, change public exports, or alter shared configuration without explicitly recording it in the handoff.
- Markdown role files define responsibilities; the external AI runner is responsible for spawning agents and enforcing this sequence.
