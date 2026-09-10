# AI Team

This directory contains the role contracts used by the project's AI development workflow.

| Role | File | Responsibility |
| --- | --- | --- |
| Senior Angular Developer | [`senior-angular-developer.md`](./senior-angular-developer.md) | Implement focused, tested Angular changes. |
| Strict Code Reviewer | [`strict-code-reviewer.md`](./strict-code-reviewer.md) | Find defects and verify the change against project requirements. |
| Strict Tester | [`strict-tester.md`](./strict-tester.md) | Reproduce bug reports and create developer tasks only for confirmed defects. |

Use [`workflow.md`](./workflow.md) as the orchestration contract. An AI runner should load `AGENTS.md`, then the role file assigned to the current stage.
