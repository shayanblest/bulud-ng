# Bulud NG public API

The generated package is intentionally split into a root entry point and
feature secondary entry points. Consumers must use these package paths only;
imports from `projects/bulud-ng/**` or other internal source paths are not
supported.

## Supported entry points

| Package path               | Public symbols                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `bulud-ng`                 | Theme and locale providers, types, and token helpers                                          |
| `bulud-ng/button`          | `BuludButton`, `BuludButtonSize`, `BuludButtonType`, `BuludButtonVariant`                     |
| `bulud-ng/badge`           | `BuludBadge`, `BuludBadgeSize`, `BuludBadgeVariant`                                           |
| `bulud-ng/dropdown`        | `BuludDropdown`, `BuludDropdownOptionTemplateContext`, `BuludDropdownSelectedTemplateContext` |
| `bulud-ng/resize-observer` | `BuludElementSize`, `BuludResizeObserver`                                                     |

The root entry point contains shared configuration and locale contracts. UI
features are imported from their own secondary entry point so unused features
remain tree-shakable.

## Export rules

- Every supported symbol is re-exported from an intentional `public-api.ts`.
- Internal implementation files, templates, styles, and helpers are not part
  of the public API.
- Public classes, types, inputs, outputs, and configuration fields use typed
  declarations; `any` is not part of the supported API.
- Public behavior is documented in `projects/bulud-ng/README.md` and in the
  source API comments where applicable.
- The package declares `sideEffects: false`; theme CSS is an explicit asset
  import and is not auto-injected.

## Verification

Run `npm run build` and inspect `dist/bulud-ng/package.json`. The build must
contain only `.`, `./badge`, `./button`, `./dropdown`,
`./resize-observer`, `./theme.css`, `./tailwind.css`, and generated metadata.
Consumers should import only from the paths in the table above.
