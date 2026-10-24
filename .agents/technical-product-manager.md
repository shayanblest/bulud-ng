# Technical Product Manager

## Role

Turn product requests into implementation-ready requirements and a focused Beads backlog for Bulud NG. The Technical Product Manager defines user value, scope, acceptance criteria, dependencies, labels, and validation; it does not implement source code, tests, or configuration.

# PRD: Bulud NG production-ready Angular UI library

## Summary

Bulud NG will provide a small, tree-shakable Angular UI library with typed standalone APIs, accessible interaction patterns, predictable configuration, consumer-owned theming, forms integration, localization, and reliable demo/test coverage. The first milestone makes the existing library surfaces trustworthy and establishes the foundation for adding more controls consistently.

## Problem

The workspace contains reusable Angular surfaces, but the supported public contract, audit evidence, configuration/theming precedence, accessibility behavior, demos, and automated validation must be made explicit and repeatable before the library expands. Without that foundation, each new component risks inconsistent APIs, inaccessible interaction, accidental exports, and incomplete release validation.

## Users and use cases

- Angular application developers importing standalone controls from stable public entry points.
- Design-system teams configuring library defaults while retaining per-instance overrides.
- Product teams building keyboard-accessible, localized, RTL-capable forms and interfaces.
- Maintainers adding components without duplicating packaging, theming, or validation conventions.

## Goals

- Establish a documented, audited contract for every existing public surface.
- Make accessibility, forms behavior, configuration precedence, theming, localization, and RTL behavior testable requirements.
- Ensure every public feature has a secondary entry point, documentation, demo coverage, unit tests, and applicable E2E coverage.
- Keep the package tree-shakable, dependency-light, standalone, typed, OnPush, and zoneless-compatible.
- Create a repeatable issue/task backlog that can be implemented one independently verifiable behavior at a time.

## Non-goals

- Replacing Angular, Tailwind CSS, Angular Forms, or Playwright.
- Adding a runtime theme switcher owned by the library.
- Adding a component framework, global state manager, or required third-party dependency.
- Restoring removed scaffold placeholders or supporting private source-directory imports.
- Implementing every possible UI control in the first milestone.

## Current supported surfaces

- `bulud-ng`: typed theme and locale configuration APIs.
- `bulud-ng/button`: standalone accessible button.
- `bulud-ng/badge`: standalone badge.
- `bulud-ng/dropdown`: searchable single- and multiple-select dropdown with forms support.
- `bulud-ng/resize-observer`: typed element-size observation directive, if retained after audit.
- Explicitly imported `theme.css` and `tailwind.css` assets.

## Product requirements

1. All public APIs are exported intentionally through the root or a documented secondary `public-api.ts` entry point.
2. Components use standalone Angular APIs, typed signal inputs/outputs, `OnPush`, zoneless-compatible behavior, and no `any`.
3. Configuration follows `instance override → component default → global config → library default`; every new option has a precedence test.
4. Themeable values use CSS custom properties and support root/scope CSS variables, typed global theme configuration, and per-instance overrides.
5. Light/dark theme assets are explicit imports; ancestor theme, direction, and locale context are respected without the library owning the switcher.
6. Interactive controls use semantic HTML and complete applicable WAI-ARIA keyboard, focus, name, role, and state patterns.
7. Form controls implement `ControlValueAccessor` and `Validator` when their behavior represents form state.
8. Every public feature documents purpose, typed API, usage, keyboard behavior, consumer ARIA responsibilities, states, and compatibility notes.
9. Every declared state is reachable from the demo and asserted by unit or E2E coverage as applicable.
10. Release validation runs formatting, lint, unit tests, library build, demo build, and E2E checks required by the changed surface.

## State and edge-case contract

Each component task must explicitly cover applicable states: default, variants, sizes, disabled, loading, error/invalid, focus-visible, hover, empty, RTL, light theme, dark theme, reactive updates, keyboard and pointer interaction, and form states. Non-applicable states must be documented rather than silently omitted.

## Proposed epics, issues, and tasks

These planning IDs are stable PRD references. The workflow runner creates the corresponding Beads epic/tasks when the product request is accepted. GitHub Issues are optional mirrors and never replace the Beads records.

### E0 — Audit and release gate

Label: `epic:audit`, `area:governance`

| ID    | Issue / task                                                  | Labels                                         | Depends on | Acceptance criteria                                                                                                      |
| ----- | ------------------------------------------------------------- | ---------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| E0-T1 | Reconcile the existing component inventory and audit evidence | `type:audit`, `area:governance`, `priority:P0` | —          | Publish one audit row per surface with source, public API, config, theme, a11y, forms, demo, E2E, and unit evidence.     |
| E0-T2 | Define the supported public API and packaging contract        | `type:task`, `area:packaging`, `priority:P0`   | E0-T1      | Root and secondary exports are intentional, documented, buildable, and importable from package paths.                    |
| E0-T3 | Establish the release validation gate                         | `type:task`, `area:tooling`, `priority:P1`     | E0-T1      | Required format, lint, unit, build, demo, E2E, public-API, and dependency checks are runnable and reported individually. |

### E1 — Shared configuration, theme, and locale foundation

Label: `epic:foundation`, `area:shared-api`

| ID    | Issue / task                                     | Labels                                      | Depends on | Acceptance criteria                                                                                                        |
| ----- | ------------------------------------------------ | ------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| E1-T1 | Complete typed theme configuration precedence    | `type:feature`, `area:theme`, `priority:P0` | E0-T2      | Instance, component, global, and library defaults resolve in the fixed order with unit and computed-style tests.           |
| E1-T2 | Complete explicit light/dark CSS variable themes | `type:feature`, `area:theme`, `priority:P1` | E1-T1      | Theme assets are explicit imports, contain no component hardcoded theme values, and respond to ancestor theme context.     |
| E1-T3 | Integrate locale defaults and direction behavior | `type:feature`, `area:i18n`, `priority:P1`  | E0-T2      | English/Persian defaults, instance text overrides, accessible labels, and ancestor RTL behavior are documented and tested. |

### E2 — Existing component hardening

Label: `epic:components`, `area:components`

| ID    | Issue / task                                                 | Labels                                             | Depends on   | Acceptance criteria                                                                                                                                                                         |
| ----- | ------------------------------------------------------------ | -------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E2-T1 | Complete Button accessibility, states, and API coverage      | `type:task`, `area:button`, `priority:P1`          | E1-T1        | Variants, sizes, disabled/loading semantics, focus-visible behavior, keyboard behavior, theme overrides, demo, and tests pass.                                                              |
| E2-T2 | Complete Badge semantics, dismiss behavior, and API coverage | `type:task`, `area:badge`, `priority:P1`           | E1-T1, E1-T3 | Variants, dismissible state, accessible naming, theme/locale behavior where applicable, demo, and tests pass.                                                                               |
| E2-T3 | Complete Dropdown accessibility and forms behavior           | `type:task`, `area:dropdown`, `priority:P0`        | E1-T1, E1-T3 | Combobox/listbox keyboard pattern, focus management, search, single/multiple selection, forms validation, disabled/loading/empty/error states, RTL, demo, unit, and E2E tests pass.         |
| E2-T4 | Validate or harden the ResizeObserver directive              | `type:task`, `area:resize-observer`, `priority:P2` | E0-T2        | Typed initial/change notifications, duplicate suppression, enable/disable lifecycle, SSR fallback, demo, documentation, unit, and E2E coverage pass; remove from scope if audit rejects it. |

### E3 — Test, demo, and documentation completeness

Label: `epic:quality`, `area:quality`

| ID    | Issue / task                                        | Labels                                    | Depends on                 | Acceptance criteria                                                                                                                                                                    |
| ----- | --------------------------------------------------- | ----------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E3-T1 | Complete demo state matrix                          | `type:task`, `area:demo`, `priority:P1`   | E2-T1, E2-T2, E2-T3        | Each public component exposes every applicable state and consumer override path in the demo.                                                                                           |
| E3-T2 | Add Playwright behavior and computed-style coverage | `type:task`, `area:e2e`, `priority:P1`    | E3-T1                      | E2E covers real keyboard/pointer interaction, focus, ARIA, RTL, light/dark, instance theme overrides, and applicable state transitions.                                                |
| E3-T3 | Complete public API documentation and examples      | `type:task`, `area:docs`, `priority:P1`   | E0-T2, E2-T1, E2-T2, E2-T3 | Every public entry point has purpose, typed inputs/outputs/config, usage example, states, keyboard guidance, and consumer ARIA notes.                                                  |
| E3-T4 | Run final strict review and release validation      | `type:task`, `area:review`, `priority:P0` | E0-T3, E3-T2, E3-T3        | Local Strict Code Reviewer approval is recorded before publication; exactly one commit remains; all required validation and subsequent CI checks pass; no API/dependency risks remain. |

## Dependency and sequencing rules

- Complete E0-T1 before creating implementation tasks from audit findings.
- Complete E0-T2 before adding or changing public entry points.
- Complete E1 foundation tasks before hardening components that consume them.
- Keep each issue independently implementable and reviewable; use dependencies only for genuine blockers.
- Use one PR per focused issue and exactly one commit per PR. Review fixes amend that commit and force-push with `git push --force-with-lease`.
- Close the Beads task after local reviewer approval and applicable E2E validation, before committing, pushing, and creating the PR. Record the PR URL afterward; close the GitHub PR only after merge and record the merge reference.
- Use the Beads ID as the canonical reference in branches, PRs, handoffs, and review comments. Mirror to GitHub Issues only when explicitly enabled.

## Validation and definition of done

For each task, run the narrowest relevant checks plus the applicable full release checks:

- `npm run format:check`
- `npm run lint`
- `npm run test` or the focused configured unit suite
- `npm run build` when the configured script already names `bulud-ng`; otherwise use the configured project-specific build command
- `npm run build:demo` when the demo or app integration changes
- `npm run e2e` when markup, states, demos, or theming change
- `git diff -- projects/bulud-ng/src/public-api.ts`
- `git diff -- package.json package-lock.json`

The handoff must report every check separately, changed files, public API/dependency impact, PR URL, risks, and out-of-scope observations.

## Risks and open decisions

- Existing repository history and imported issue records may not reflect the current checkout; audit evidence must be reconciled before implementation expansion.
- The configured unit runner is Karma/Jasmine despite generic references to Vitest; preserve the existing configuration unless a separate approved migration is defined.
- Decide whether `resize-observer` is a supported first-class entry point or an experimental utility before publishing it.
- Confirm the project’s GitHub/Beads synchronization policy and permissions before creating mirrored live records.

## GitHub integration

Beads is the canonical tracker. When a GitHub Issue mirror is explicitly
requested, use the GitHub MCP tools rather than the `gh` CLI:

1. Call `mcp__github__get_me` to verify the authenticated user and permissions.
2. Call `mcp__github__search_issues` to avoid creating a duplicate mirror.
3. Call `mcp__github__list_issue_types` when the repository or organization uses issue types.
4. Create the mirror with `mcp__github__issue_write(method="create", ...)` and include `Beads: <issue-id>` in the title or body.
5. Add synchronization updates with `mcp__github__add_issue_comment` and record the GitHub URL in Beads.

Do not create a GitHub Issue instead of a Beads task. Do not use `gh` commands
for issue, pull-request, review, or repository operations; use the corresponding
GitHub MCP tool and record failures in Beads.
