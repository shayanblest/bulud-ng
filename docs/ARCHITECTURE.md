# bulud-ng Architecture

## 1. Purpose

`bulud-ng` is a reusable Angular UI library based on:

- Angular 20+
- Standalone APIs
- Signals
- Zoneless change detection
- Tailwind CSS v4
- Strict TypeScript
- Vitest
- npm package distribution

The library must provide small, accessible, configurable, and tree-shakable UI building blocks.

---

## 2. Core Principles

- All components, directives, and pipes are standalone.
- Components use `OnPush` change detection.
- The library must not depend on `zone.js`.
- Public APIs must be explicit and minimal.
- Prefer native Angular and browser APIs over extra dependencies.
- Prefer composition and content projection over large configurable components.
- Accessibility is part of every interactive component contract.
- New abstractions require a concrete repeated use case.
- New dependencies require explicit justification.

---

## 3. Package Structure

The library is conceptually divided into:

### Foundation

Shared contracts and utilities:

- configuration
- theme tokens
- injection tokens
- class utilities
- direction utilities
- accessibility helpers
- shared types

Foundation must not depend on feature components.

### Components

Components are implemented in phases:

1. Core and Form
2. Overlay and Navigation
3. Data and Advanced

Each component should have its own focused implementation, public API, and tests.

### Directives

Directives must have one focused responsibility, such as:

- autofocus
- click outside
- focus trap
- loading
- resize observer
- infinite scroll

### Pipes

Pipes should be pure by default and include utilities such as:

- truncate
- initials
- file size
- Persian/English digits
- highlight
- join

---

## 4. Public API

Consumers must import public symbols from the package entry point.

The package must not require imports from internal file paths.

Every public symbol requires:

1. explicit export
2. typed public API
3. unit tests
4. documentation when the behavior is non-trivial

Public APIs should remain additive and avoid exposing internal DOM structures or helper functions.

---

## 5. Configuration

The library supports two configuration levels:

### Global Configuration

Applications can define global defaults using a tree-shakable provider:

provideBuludNg(...)

Global settings may include:

- direction
- theme
- component defaults
- animation preferences
- accessibility defaults
- locale-sensitive formatting

### Instance Overrides

Components may override relevant settings through strongly typed inputs or configuration.

Configuration precedence:

text
instance override
> component default
> global configuration
> library default

Instance overrides must not mutate global configuration.

---

## 6. Styling and Theme

Styling follows a hybrid strategy:

text
static Tailwind CSS v4 utilities
+
CSS custom properties
+
typed theme configuration

Rules:

- Tailwind class names must remain statically analyzable.
- Dynamic Tailwind class construction is prohibited.
- Runtime design values should use CSS custom properties.
- Variants and sizes should use static class maps.
- RTL/LTR and light/dark modes must be supported.

Detailed theme contracts belong in:

text
docs/THEME.md

Utility API and lifecycle contracts belong in:

text
docs/UTILITY-API.md

---

## 7. Forms and Composition

Value-based form controls should integrate with Angular Forms and support:

- `ControlValueAccessor`
- disabled state
- touched state
- change propagation
- blur propagation

Content projection should be preferred for structured components such as:

- cards
- dialogs
- drawers
- form fields
- empty states
- table cells

---

## 8. Overlays and Accessibility

Overlay components must define their behavior for:

- positioning
- stacking
- keyboard interaction
- escape key
- outside click
- focus management
- cleanup
- closing
- RTL

Interactive components must provide appropriate:

- semantic HTML
- keyboard support
- focus indication
- labels and descriptions
- ARIA attributes
- disabled and busy states

A shared overlay abstraction should be introduced only when multiple features genuinely require it.

---

## 9. Runtime and Packaging

- Browser APIs must be accessed safely and cleaned up.
- Avoid unnecessary browser-only work during construction.
- Do not add SSR-specific dependencies without a concrete requirement.
- Package output must contain only intended distributable files.
- The library must remain tree-shakable and bundle-size conscious.

---

## 10. Implementation Order

Implementation should proceed through small, independently testable issues:

1. foundation contracts
2. theme and configuration
3. shared styling utilities
4. primitive components
5. form components
6. directives and pipes
7. overlays and navigation
8. data and advanced components
9. packaging and release validation
