# Angour application foundation

The `base` Angular application is a lean starting point inside the bulud-ng
workspace. The original component demo remains a separate target. All base
pages inherit Angour tokens from the document root, including light/dark
surfaces, navy/gold primary colors, controls, spacing and typography. Small
error/danger text uses `--bulud-color-danger-text`, with at least 4.5:1 contrast
on the default light/dark surfaces; danger button colors remain unchanged.

## Run and build

```sh
npm run ng -- serve base --host 127.0.0.1 --port 4310
npm run ng -- build base
node tools/measure-base.mjs
npm run e2e -- --config playwright.base.config.ts
```

Production files are emitted to `dist/base/browser`. Configure the deployment
server to return `index.html` for application routes such as `/forms`.

`projects/base/src/main.ts` owns the shell and routes. The overview is eager to
avoid an extra request before the first page can render. The form route loads
lazily; it does not add its controls and Angular Forms code to the initial route.
Only intentional public secondary entry points are imported. No new dependency,
remote font service, UI framework or application backend was introduced.

`preferences.ts` owns language, direction and theme. Only these preferences are
persisted locally; form values and passwords are not stored. Storage failures
fall back to in-memory preferences. The library itself never changes the
consumer's document language, theme or direction.

The CSS files `angour.css` and `angour-base.css` are imported explicitly. Library
JavaScript remains tree-shakable; package metadata marks CSS as side-effectful
so consumer bundlers preserve explicit stylesheet imports. Typography uses the
Angour font tokens and available application/system font files.

## Form behavior

`forms.ts` provides typed reactive controls and localized, associated errors.
The example demonstrates required/whitespace, email, minimum/maximum length,
pattern, finite numeric values, inclusive min/max, HTTP(S) URLs, matching fields,
required-true agreement, optional switch, selection membership/count limits and
Persian/Gregorian single/range dates. Invalid submit focuses the first invalid
field. Reset clears errors, values and the successful-validation notice.

The async email validator is deliberately a local example Observable that
reserves `used@example.com`. Replace it with an injected service returning your
API result. Submission currently validates locally and displays a confirmation;
it does not create an account or send data. Server validation, authentication and
project-specific business rules belong to the consuming application/API.

## Reusable validators

Import from `bulud-ng/validators`:

| Export                            | Behavior / error                                                             |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `buludRequiredText`               | Requires non-whitespace string text; `required`                              |
| `buludFiniteNumber`               | Optional finite numeric value, rejects numeric strings; `finiteNumber`       |
| `buludHttpUrl`                    | Optional absolute HTTP(S) URL; `url`                                         |
| `buludIsoDate`                    | Optional Gregorian ISO date-only, actual valid date, years 0001–9999; `date` |
| `buludMatchFields(first, second)` | Pure group validator comparing named children; `matchFields`                 |

```ts
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { buludRequiredText, buludHttpUrl, buludMatchFields } from "bulud-ng/validators";

const form = new FormGroup(
  {
    name: new FormControl("", [buludRequiredText, Validators.maxLength(80)]),
    website: new FormControl("", buludHttpUrl),
    password: new FormControl("", [Validators.required, Validators.minLength(8)]),
    confirm: new FormControl("", Validators.required),
  },
  { validators: buludMatchFields("password", "confirm") },
);
```

Optional validators accept empty values. Combine them with `Validators.required`
when a value is mandatory. `buludMatchFields` reports a group error without
mutating child errors; missing configured controls also produce an error.
Use Angular's existing `Validators.email`, `min`, `max`, `minLength`,
`maxLength`, `pattern`, `requiredTrue` and application-specific async validators
alongside these helpers.

## Updated control contracts

Dropdown keeps the existing host `id` behavior. Optional `inputId` puts a unique
ID on its actual trigger for `<label for>`. `aria-labelledby`,
`aria-describedby` and `aria-errormessage` reach the trigger; `invalid` supports
consumer-managed forms. Explicit `language` overrides the injected locale for
all built-in labels, including selected counts, without changing values.

- `minSelected` / `maxSelected`: optional nonnegative integer inputs applying
  to multiple mode. Invalid limits report `selectionBounds`; count errors are
  `minSelected` / `maxSelected`, with bound and actual count.
- `requireOption`: opt-in membership validation using `compareWith`. Reports
  `option` once `loading` is false. Existing asynchronous/preloaded selections
  remain accepted by default. Mode/value shape mismatch reports `selectionType`.
- Required selection still reports `required`; values are retained for error
  handling rather than silently discarded.

Radio group also supports optional `requireOption` and
`aria-errormessage`. Its options are projected radios belonging to that group;
option changes revalidate the form. Numeric zero remains valid. Nonfinite
numeric values report `radioValue`. Default membership behavior is unchanged.

Datepicker malformed ISO bounds and reversed bounds report `dateBounds`, even
when an optional value is empty. Invalid constraints close/prevent opening the
calendar. Required, invalid date, incomplete/reversed range, minimum and maximum
errors retain their documented keys and ISO values.

Checkbox/Switch continue to use native interaction and required-true semantics.
Buttons, tabs, accordion, dialog, badges and pagination are not data-entry form
controls; they retain their appropriate disabled, state and accessibility rules.
Native text/number/textarea inputs use Angular/native validators rather than
adding artificial form-validation APIs to display/navigation components.

## Performance checks

The production build has a 300 kB initial warning budget and a 350 kB error
budget. `measure-base.mjs` independently reads generated index assets and fails
above 300 kB, reporting raw and gzip bytes. Form code remains lazy. Closed
Datepickers render no day/year buttons and register no outside pointer listener;
Dropdown outside listeners exist only while open and search label normalization
is cached until options/label dependencies change.

See `FOUNDATION-AUDIT.md` and `FOUNDATION-VALIDATION.md` for scope and results.
