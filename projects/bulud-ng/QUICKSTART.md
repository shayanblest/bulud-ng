# Install and use Bulud NG

Bulud NG is an Angular library: use it in a standalone Angular 20.3.34+ application.
The minimum peer version includes the current Angular 20 security patches.
It is domain independent; components do not depend on Angour business services,
API URLs or application routes. React/Vue and other Angular majors are outside
the verified compatibility range.

## Install

Until the owner completes public npm publication, install the built tarball:

```bash
# Library workspace
npm run package:local
# Consumer application — substitute the actual path
npm install /absolute/path/bulud-ng/dist/packages/bulud-ng-0.0.1.tgz
```

After publication: `npm install bulud-ng` (or the final owner-selected scoped
name). Do not install/publish the private workspace root. Angular and RxJS are
peers; Tailwind 4 is optional and no third-party chart library is required.

## Minimal standalone component

```ts
import { Component, signal } from "@angular/core";
import { BuludButton } from "bulud-ng/button";
import { BuludAlert } from "bulud-ng/feedback";

@Component({
  selector: "app-root",
  imports: [BuludButton, BuludAlert],
  template: `
    <bulud-button (click)="saved.set(true)">Save</bulud-button>
    @if (saved()) {
      <bulud-alert kind="success" title="Saved" dismissible dismissLabel="Dismiss message" (dismissed)="saved.set(false)"> Your changes were saved. </bulud-alert>
    }
  `,
})
export class App {
  readonly saved = signal(false);
}
```

Bootstrap this component through your existing application's normal Angular
bootstrap. No library module or global component registration is needed.
Import only the features you use, from their public secondary entry points.

## Angour design, theme and direction

In your application's global stylesheet:

```css
@import "bulud-ng/theme.css";
@import "bulud-ng/angour.css";
@import "bulud-ng/angour-base.css";
```

In the application document or a surrounding scope:

```html
<html lang="fa" dir="rtl" data-bulud-preset="angour" data-theme="light"></html>
```

Set `data-theme="dark"` to switch appearance; use `dir="ltr"` and `lang="en"`
for English layout. Register the locale for component text separately:

```ts
import { provideBuludLocale } from "bulud-ng";
// In ApplicationConfig.providers:
provideBuludLocale({ language: "fa", direction: "rtl" });
```

The library reacts to your scope and does not create a theme switcher or force
all application routes to use the same language. Some shared components accept
explicit label inputs; supply your application's translations for these.

For default styling without the Angour preset, import only `theme.css`.
For Tailwind utilities, optionally import `bulud-ng/tailwind.css` through your
own Tailwind 4 build. Tailwind is not needed for component styles.

## Forms and data

Use your existing Angular reactive/template forms and validators. Give controls
visible labels and associate error messages with `aria-describedby`.
`bulud-ng/field-label` can read required metadata from an Angular control.
`bulud-ng/validators` adds generic validators; server-side validation remains
part of the application.

Tables, charts and chat accept consumer-owned data. File upload requires your
own authenticated endpoint and transport options. No demo receiver is included
in the library. Import query helpers from `bulud-ng/query` to bridge URL state
explicitly; the library does not own your router or HTTP interceptors.

## Theme overrides

Use scoped CSS variables or the typed providers (`provideBuludTheme` and
`BULUD_SHARED_UI_CONFIG`), or a component's `theme` input. Precedence is:
instance override → component default → global config → library fallback.
Import the theme CSS explicitly; no theme stylesheet loads as an import side
effect of a component. Read [README.md](README.md) and [SHARED.md](SHARED.md)
for all inputs, outputs and examples.

## Server rendering and compatibility

The release checks install the tarball with Angular 20.3.34, compile
all public declarations with `skipLibCheck=false`, AOT-compile a consumer of 26
feature entries and server-render it without browser globals. Browser-dependent
features (file picking/upload, layout observation and dialog focus) activate
on the client. Client interaction and theme tests run separately in Playwright.
Hydration of every possible application configuration is not claimed.

For server applications that call Angular's `renderApplication`, configure
`allowedHosts` with your actual application hostnames. The isolated test permits
only `localhost`; this package does not modify host validation for your app.
