# Demo, package installation and reusable additions

## Run once

From the workspace, run `npm ci` on first setup, then `npm start`.
This builds the optimized demo and serves it at **http://127.0.0.1:4314/components**.
The catalog links to separate lazy feature pages, each with a live example, source sample and API notes. Existing `/`, `/forms`, `/shared`, `/charts` routes remain available. `npm run dev` starts the editable development preview on 4310. Do performance audits against `npm start`, not the development server.

The demo upload endpoint discards received data. It is a bounded local test receiver, not production file storage. Supply your authenticated endpoint with `BuludFileUpload` in a consuming application.

## Install the current build locally

```sh
npm run build
npm run package:local
# In another Angular 20 project, use the actual absolute tarball path:
npm install /path/to/bulud-ng/dist/packages/bulud-ng-0.0.1.tgz
```

```ts
import { BuludButton } from "bulud-ng/button";
import { BuludPeriodPicker } from "bulud-ng/period-picker";
import { BuludDonutChart, BuludProgress } from "bulud-ng/charts";
```

Import CSS explicitly in the consumer's global stylesheet:

```css
@import "bulud-ng/angour.css";
@import "bulud-ng/angour-base.css";
```

Place `data-bulud-preset="angour"`, `data-theme="light"` or `"dark"`, and `dir="rtl"` or `"ltr"` on an ancestor. The application owns language/theme preferences. Peer dependencies are Angular 20 and RxJS; Tailwind is optional. Import specific secondary entries, not a barrel of every component. CSS is marked as a side effect; feature JavaScript has no eager global registrations. The demo is not included in the published library.

`npm run validate:tree-shaking` packs the actual compiled package, resolves it from five isolated Angular AOT consumers without source aliases, builds production bundles and verifies unused components are absent. It also compiles all exported entry declarations with `skipLibCheck: false` and checks every CSS export. It uses the existing workspace toolchain and does not download dependencies.

Public npm publication is **deferred by the user**. The package name/version currently remain `bulud-ng@0.0.1`; the account/scope and license must be chosen before publishing. No registry publication or ownership claim has been made. After choosing those details, add the license/metadata, check the tarball, authenticate with npm and publish with public access. Do not publish the private workspace root.

## Added APIs

All components are standalone and OnPush. Shared theme options use `Partial<BuludSharedUiTheme>` and follow instance → component → global → scoped CSS fallbacks. Configure global/component layers with `BULUD_SHARED_UI_CONFIG`; inherited CSS variables and per-host `[style.--bulud-…]` remain usable.

| Entry / API                           | Inputs and defaults                                                                                                                                                                                                                                           | Behavior and accessibility                                                                                                                                                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `avatar` / `BuludAvatar`              | `name=''`, `src?`, `label?`, `theme?`                                                                                                                                                                                                                         | Accessible image name = label, name, or Avatar. Failed images become initials; a different src retries. Decorative inner image, no authentication behavior. CSS `--bulud-avatar-size` defaults 48px.                                                                                                                    |
| `empty-state` / `BuludEmptyState`     | required `title`, `description=''`, `theme?`                                                                                                                                                                                                                  | Named section, heading and optional text. Project native buttons/links for actions; optional decorative `[buludEmptyIcon]` content. No forced route or external assets.                                                                                                                                                 |
| `period-picker` / `BuludPeriodPicker` | required `label`; `mode='month'` or year, `value=null`, `language='en'`, `calendar?`, ISO date `min/max=null`, `required/disabled/invalid=false`, `describedBy?`, `theme?`; labels previousYearLabel/nextYearLabel/yearLabel/clearLabel have English defaults | CVA, Validator and `[(value)]`. Native buttons/year input support Tab, Enter/Space, numeric arrow keys. Caller translates labels and supplies touched-state invalid/error text. Calendar defaults to value calendar then language (fa Persian, en Gregorian); explicit calendar wins. Selected month uses aria-pressed. |
| `charts` / `BuludDonutChart`          | required `caption`, `segments=[]`, `loading=false`, `emptyLabel='No chart data'`, `loadingLabel='Loading chart…'`, `errorLabel='Invalid chart data'`, `theme?`                                                                                                | Up to 64 nonnegative finite segments; zero sum is empty. SVG has an accessible name and a full text legend. No timers, external chart library or hover-only data.                                                                                                                                                       |
| `charts` / `BuludProgress`            | required `label`, `value=0`, `max=100`, `variant='bar'` or ring, `loading=false`, `errorLabel='Invalid progress value'`, `theme?`                                                                                                                             | Requires positive finite max and value in [0,max]. Progressbar exposes value/min/max; loading omits current value. Invalid values display a status instead of a false percentage.                                                                                                                                       |

```html
<bulud-avatar name="Example User" />
<bulud-empty-state title="No results" description="Try another filter">
  <button type="button" (click)="clearFilters()">Clear filters</button>
</bulud-empty-state>
<bulud-period-picker label="Month" language="fa" [formControl]="month" required />
<bulud-donut-chart caption="Distribution" [segments]="[{label:'One',value:40},{label:'Two',value:60}]" />
<bulud-progress label="Upload" [value]="65" variant="ring" />
```

`BuludPeriodValue` is `{calendar:'gregory'|'persian',year:number,month?:number}`. Year must be an integer 1–9999 and representable as a four-digit ISO range; month is 1–12. Month mode requires month; year mode omits it. `buludPeriodRange(value:unknown)` returns inclusive `{from,to}` ISO dates or null. A selection must fit wholly inside min/max. CVA errors: required, period (bad value/mode/calendar), periodBounds (bad/reversed min/max), periodRange (out of bounds), periodConfig (unsupported runtime mode/calendar). Values remain calendar-qualified; Persian year/month is not misrepresented as Gregorian ISO.

The datepicker entry additionally exposes pure `buludCalendarDate(year,month,day,calendar)` (UTC-noon Date or null), `buludCalendarParts(date,calendar)` and `buludParseIsoDate(value)` plus `BuludCalendarDate`. These have no application state and are shared by the period picker.

Utilities entry additions:

| API                                                         | Contract / example                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buludRemoveEmptyFields<T>(object):Partial<T>`              | Shallow immutable removal of null/undefined/empty string; preserves false, zero, arrays/objects. `buludRemoveEmptyFields({a:'',b:0})` → `{b:0}`.                                                                                                                                                        |
| `buludShiftYears(date,years):Date                           | null`                                                                                                                                                                                                                                                                                                   | UTC year shift, safe integer years, clamps leap dates, no mutation; invalid/unrepresentable date → null. |
| `buludSecondsUntil(deadlineSeconds,nowMs=Date.now()):number | null`                                                                                                                                                                                                                                                                                                   | Ceiling of seconds remaining; negative = expired; nonfinite inputs → null. No background interval.       |
| `buludTimeSlots(stepMinutes=30):readonly BuludTimeSlot[]`   | Integer step 1–1440, otherwise RangeError. Complete day [00:00,24:00), final slot can be shorter. At most 1440 slots.                                                                                                                                                                                   |
| `BuludUnixTimeConverterPipe` / `buludUnixTimeConverter`     | `timestamp:period:language:timeZone:unit`, period daily/weekly/monthly/yearly (monthly default), en/fa (en default), optional timezone, seconds/milliseconds (seconds default). Daily = time, weekly/monthly = date, yearly = date+time. Invalid input/timezone → '-'; bounded Intl caches. `1735689600 | buludUnixTimeConverter:'yearly':'en':'UTC'`.                                                             |

Pagination is controlled through `[currentPage]` and `(pageChange)`. Counts ≤5 show all pages; larger counts keep first/last/current and nearby pages, with noninteractive ellipses for skipped ranges. At most five numbered buttons are allocated, including for MAX_SAFE_INTEGER page counts. Previous/next and first/last page buttons provide access to every page. Table pagination is centered; native overflow retains accessibility in narrow containers.

See the current component catalog / chat / label / display-pipe contracts in [SHARED.md](SHARED.md).

Before public publication, run `node dist/bulud-ng/publish-check.mjs`. This deliberately
fails while the owner-selected license and LICENSE file are missing. Add the chosen
LICENSE to the `ng-package.json` assets when that decision is made. This check is also
run automatically by `npm publish` inside the built package; local `npm pack` remains
available. Run the historical API/dependency approval checks separately; a successful
pack or consumer build does not imply those review gates passed.
