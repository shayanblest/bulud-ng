# Bulud NG

Bulud NG is an Angular component library focused on reusable APIs,
accessibility, predictable behavior, and low runtime overhead.

The workspace targets Angular 20 and publishes features as tree-shakable
secondary entry points.

## Development

Install dependencies:

```bash
npm install
```

Run the unit tests once in headless Chromium:

```bash
npm run test:ci
```

The default browser is `ChromeHeadless`. Set `CHROME_BIN` when Chromium is not
available at `/snap/bin/chromium`.

## Beads task tracking

This repository uses [Beads](https://github.com/gastownhall/beads) for local
task tracking. Install the `bd` CLI, then initialize the repository after
cloning:

```bash
bd init
bd dolt pull
bd ready
```

Push task changes before switching devices or ending a session:

```bash
bd dolt push
```

Tasks sync through the repository's Dolt remote. Use `bd dolt pull` on another
device to retrieve them; do not merge or compare the special Dolt refs with
normal Git branches.

An optional local web UI is available through `beads-ui`:

```bash
npm install -g beads-ui
bdui start --open
```

Compile the Tailwind token bridge:

```bash
npm run test:tailwind
```

Build the production package:

```bash
npm run build
```

The package output is written to `dist/bulud-ng`.

## Component preview

Start the standalone demo application:

```bash
npm run demo
```

Then open `http://localhost:4200`.

Create an optimized demo build:

```bash
npm run build:demo
```

The demo lives under `projects/demo` and imports the library through local
TypeScript path mappings, so component and theme changes are reflected during
development without publishing the package.

Its consumer-owned theme is defined in
`projects/demo/src/bulud.config.ts`. Global Tailwind integration lives in
`projects/demo/src/styles.css`.

## Project structure

```text
projects/bulud-ng/
├── src/
│   ├── public-api.ts       # Theme configuration API
│   └── lib/theme/          # Typed config and Angular provider
├── button/                 # Button secondary entry point
│   ├── public-api.ts
│   ├── ng-package.json
│   └── bulud-button/
├── dropdown/               # Dropdown secondary entry point
│   ├── public-api.ts
│   ├── ng-package.json
│   └── bulud-dropdown/
├── tailwind.css            # Optional Tailwind CSS 4 token bridge
├── ng-package.json
└── package.json

projects/demo/
├── src/bulud.config.ts     # Consumer theme configuration
├── src/styles.css          # Tailwind and Bulud theme bridge
└── src/app/                # Interactive component showcase
```

Each independently consumable feature should be implemented as a secondary
entry point with its own `public-api.ts`, tests, and documentation. Consumers
must import only from public package paths, never from source directories.

## Engineering standards

Repository-wide implementation rules are defined in
[`AGENTS.md`](./AGENTS.md). They cover Angular architecture, performance,
accessibility, testing, packaging, theming, and compatibility.

## Current entry points

| Entry point                | Purpose                                          |
| -------------------------- | ------------------------------------------------ |
| `bulud-ng`                 | Typed theme configuration and bootstrap provider |
| `bulud-ng/button`          | Accessible standalone button component           |
| `bulud-ng/badge`           | Accessible badge component                       |
| `bulud-ng/dropdown`        | Searchable single- and multiple-select dropdown  |
| `bulud-ng/resize-observer` | Element resize observer directive                |
| `bulud-ng/tailwind.css`    | Tailwind CSS 4 theme-variable bridge             |

## Compatibility note

The generated `Test` component and `lib-test` selector were removed during the
initial library refactor. They were scaffold placeholders and are not part of
the supported Bulud NG API.
