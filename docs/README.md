# Bulud NG development docs

This directory contains supporting guidance for human and AI contributors. Beads
is the project's main issue manager; GitHub Issues are optional mirrors.
Project rules in [`AGENTS.md`](../AGENTS.md) are authoritative; role contracts
and orchestration rules live in [`../.agents/`](../.agents/).

## Start here

- [`AI-DEVELOPMENT.md`](./AI-DEVELOPMENT.md) — practical AI contribution loop.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — package and Angular architecture.
- [`PUBLIC-API.md`](./PUBLIC-API.md) — supported package entry points and export rules.
- [`THEME.md`](./THEME.md) — theme token and override contract.
- [`COMPONENT-CHECKLIST.md`](./COMPONENT-CHECKLIST.md) — implementation and audit checklist.
- [`TASK-TEMPLATE.md`](./TASK-TEMPLATE.md) — PRD-to-task and handoff template.
- [`REVIEW-CHECKLIST.md`](./REVIEW-CHECKLIST.md) — strict remote PR review checklist.

## Authority order

When guidance conflicts, use this order:

1. User request and explicit acceptance criteria.
2. `AGENTS.md`.
3. `.agents/workflow.md` and the assigned role contract.
4. This documentation and feature-specific documentation.

Keep documentation changes focused and link back to the authoritative rule
instead of copying it into multiple locations.
