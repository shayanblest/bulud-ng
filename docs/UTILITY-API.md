# Utility API conventions

These conventions apply to every Bulud pipe and directive. Each utility must
have one focused responsibility, a standalone declaration, a public API file
when published, documentation, and focused tests.

## Pipes

- Pipes are `standalone: true` and `pure: true` unless a task documents a
  specific exception.
- The pipe class and transform method use explicit types; `any` is not allowed.
- `null` and `undefined` inputs have documented behavior and must not throw.
- Formatting pipes return a stable string and do not mutate the input value.
- Options are a typed configuration object or typed arguments, not arbitrary
  string flags.
- Tests cover normal values, empty/nullish values, boundary values, locale
  behavior where applicable, and input immutability.

Example:

```ts
@Pipe({ name: "buludFileSize", standalone: true, pure: true })
export class BuludFileSizePipe {
  transform(bytes: number | null | undefined): string {
    // The task-specific implementation defines the exact output contract.
    return bytes == null ? "" : `${bytes} B`;
  }
}
```

## Directives

- Directives have one responsibility and a selector that clearly names the
  behavior.
- Inputs and outputs use typed signal APIs. Event outputs describe the emitted
  value rather than exposing internal browser objects unnecessarily.
- Browser-only APIs are guarded with `isPlatformBrowser` or an equivalent
  platform check. Construction must be safe during SSR.
- Listeners, observers, timers, and subscriptions are cleaned up with Angular
  lifecycle APIs such as `DestroyRef`.
- Repeated identical notifications are suppressed when the behavior is a
  measurement or observer API.
- Disabled inputs stop the behavior and release resources; re-enabling it must
  reconnect deterministically.
- Tests cover browser and unavailable-API paths, enable/disable transitions,
  cleanup on destroy, and duplicate-event behavior where applicable.

## Packaging and documentation

- Export each public utility only through its feature `public-api.ts` and the
  documented package entry point.
- Keep implementation helpers under `internal/` and do not export them.
- Avoid global listeners and module-level mutable state.
- Document purpose, typed inputs/outputs, SSR behavior, cleanup behavior, at
  least one usage example, and consumer accessibility responsibilities.
- A visual utility gets a demo state; a non-visual utility gets a documented
  usage path and a demo integration when practical.

## Required validation

Every utility task reports these checks individually:

- format and lint;
- focused unit tests, including nullish/SSR/lifecycle cases as applicable;
- library build and public API inspection;
- Playwright coverage when the utility changes rendered markup, interaction,
  states, or theming.
