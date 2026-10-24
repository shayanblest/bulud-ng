# AGENTS.md — bulud-ng

Angular UI component library. Read before any change. This file overrides ambiguous requests.

## Agent Roles

- **Technical Product Manager:** Turn natural-language requests into focused Beads tasks with scope, acceptance criteria, dependencies, priorities, and required validation; do not implement code.
- **Senior Angular Developer:** Design and implement maintainable, idiomatic Angular solutions that follow the project's standalone, signals-based, zoneless, accessible, and typed architecture.
- **Strict Code Reviewer:** Review every change critically for correctness, accessibility, API stability, configuration precedence, theming, test coverage, performance, and compliance with these instructions. Identify concrete defects and unresolved risks before approval.
- **Strict Tester:** Reproduce and triage bug reports against the running application and tests. Confirm real defects with evidence, then create a focused developer task with acceptance criteria; do not implement the fix.
- Role contracts and the team handoff sequence live in `.agents/`; follow `.agents/workflow.md` when coordinating multiple agents.

## Project

- Type: Angular UI library — components, directives, pipes, utilities
- Priority order: correctness → accessibility → predictable behavior → bundle size/perf → DX
- Stack: Angular (latest stable, verify before upgrading) · Tailwind v4 · TS strict · Vitest · Playwright
- Workspace: plain Angular CLI (no Nx) — `projects/bulud-ng` (lib) + `projects/demo` (demo app)
- Package manager: npm. Use `npm run <script>` if it exists in `package.json`; else `npx <tool>`.
- ESLint/Prettier/Vitest/Playwright already configured — use as-is, don't reconfigure.
- Existing components already use standalone/signals/OnPush/zoneless. Not yet audited against the rest of this file → **first task is the audit in §7.**

## Core Rules

**Angular:** standalone only, no NgModules · signals/`computed()` for state · typed `input()`/`output()`, no `any` · `@if`/`@for`/`@switch`, no `*ngIf`/`*ngFor` · `OnPush` always.

**Zoneless:** no ZoneJS, no `NgZone.run`, no manual `detectChanges()` as a workaround, no timing-based sync.

**Packaging:** only intentional exports through `public-api.ts` · tree-shakable, no side-effectful module code · no new deps without approval.

**Config precedence** (fixed, always in this order): `instance override → component default → global config → library default`. Global config = typed injection token. Any new config option needs a precedence test.

**Theming:**
- All themeable values → CSS custom properties, no hardcoded values in component CSS
- Overridable 3 ways, all must work together: `:root`/scope CSS vars · typed theme object via global config token (same precedence chain) · per-instance `[style]`/host bindings
- Ship default light+dark theme as an explicitly-imported CSS file, never auto-injected
- Dark mode / RTL driven by ancestor attribute/class/`dir` — library reacts, doesn't own the switcher
- Tailwind: static utility classes only (no dynamic class strings) · typed variant maps, no stringly-typed variants

**Accessibility:** semantic HTML first · full keyboard pattern per WAI-ARIA APG · correct focus management/name/state/role · built in from first implementation, not retrofitted.

**Composability:** content projection over config flags · form controls implement `ControlValueAccessor`/`Validator`.

## Structure

```
projects/bulud-ng/src/lib/<feature>/
  <feature>.component.ts | .types.ts | .config.ts
  internal/            # not exported
  <feature>.spec.ts
projects/bulud-ng/src/lib/shared/    # cross-feature utils, public only if re-exported deliberately
projects/bulud-ng/src/public-api.ts  # sole source of truth for public surface
projects/demo/src/app/pages/<feature>/<feature>-demo.component.ts
e2e/                                 # Playwright specs against demo app
```
Demo app imports `bulud-ng` only via `public-api.ts`, never `lib/` internals.

**Component states** (reference list, used by demo/testing/audit below): default, each variant, each size, disabled, loading, error/invalid, focus-visible, hover, empty, RTL, light+dark theme. Every state in a component's type/config surface must be reachable in its demo page.

## Workflow

0. Audit before building new (§7) — don't start new components until audit's done or told otherwise.
1. Inspect existing code/tests/conventions before writing.
2. Small, independently verifiable increments — one component/behavior/fix per task.
3. No unrelated refactoring — note it in the report instead.
4. No unapproved dependencies.
5. Preserve existing work; don't rewrite for style preference.

## Testing

**Unit (Vitest):** behavior · config precedence incl. theme · keyboard+pointer interaction · a11y (roles/states/focus, not snapshot-only) · reactive updates.

**E2E (Playwright, against demo app):** one spec per demo page covering the full state list above · real keyboard/pointer interaction (tab order, ARIA-pattern keys, focus trap/restore) · theme override verified end-to-end (set override → assert computed style). Required for any change touching markup, states, or theming; new states need new assertions in the same task.

## Definition of Done

Run and pass, using `package.json` scripts where they exist:

1. `npm run format:check`
2. `npm run lint` — 0 errors
3. `npm run test` (headless Chromium; scoped, or full suite if change crosses features)
4. `npm run build -- bulud-ng` — 0 errors/new warnings
5. `npm run e2e` — if markup/states/theming touched
6. `git diff -- projects/bulud-ng/src/public-api.ts` — confirm intentional
7. `git diff -- package.json package-lock.json` — must be empty unless pre-approved

List every check's pass/fail in the report; don't summarize as "all passed."

## Documentation

Per public API: purpose/behavior, typed inputs/outputs/config, ≥1 usage example, a11y notes (keyboard shortcuts, required consumer-side ARIA setup).

## Task Report

```
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

## §7 Audit Task (current priority)

Existing components: modern-Angular baseline already correct (standalone/signals/OnPush/zoneless) — don't recheck. Audit everything else, one row per component:

| Check | Verify |
|---|---|
| Public API | Only via `public-api.ts`, documented |
| Config precedence | Full chain implemented + tested |
| Theming | CSS vars only, all 3 override levels work |
| Accessibility | Semantic HTML, keyboard, focus, ARIA |
| Forms | `ControlValueAccessor` where applicable |
| Demo coverage | Full state list reachable |
| E2E coverage | Playwright spec matches state list |
| Unit coverage | Behavior/precedence/interaction/a11y/reactivity |

Output the report first. Fix gaps as separate tasks, highest-risk first (a11y, config precedence) before cosmetic (missing demo states).
