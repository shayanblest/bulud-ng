# ClickOutside directive

`BuludClickOutside` is an opt-in standalone directive that emits a typed
notification when pointer or focus interaction occurs outside its host.

```html
<section buludClickOutside [enabled]="menuOpen()" (outside)="closeMenu()">Menu content</section>
```

Use `[triggers]="['pointerdown']"` or `[triggers]="['focusin']"` when only
one interaction kind is appropriate. The directive is browser-safe for SSR,
deduplicates repeated trigger configuration, and removes document listeners
when disabled or destroyed. Consumers should provide an accessible trigger,
manage its `aria-expanded` state, and restore focus when closing an overlay.
