# Bulud NG Demo

Interactive Angular preview for the local Bulud NG component library.

## Run locally

From the workspace root:

```bash
npm run demo
```

The development server is available at `http://localhost:4200`.

## Production build

```bash
npm run build:demo
```

Output is written to `dist/demo`.

## Customize the preview theme

Edit `src/bulud.config.ts`. The configuration is registered through
`provideBuludTheme()` in `src/app/app.config.ts`.

The same values drive:

- Bulud component CSS variables;
- Tailwind utilities such as `bg-bulud-primary`;
- shared border, focus, shape, and control-size tokens.

The preview also demonstrates `bulud-ng/dropdown` with searchable single
selection, multiple selection, and projected option templates.

The local Tailwind bridge is imported from `src/styles.css`.

## Architecture

- standalone root component;
- zoneless change detection;
- strict Angular templates and TypeScript;
- Tailwind CSS 4 through PostCSS;
- direct local imports from `bulud-ng`, `bulud-ng/button`, and
  `bulud-ng/dropdown`;
- no demo-only runtime dependencies.
