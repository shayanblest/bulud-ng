import {
  afterRenderEffect,
  booleanAttribute,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  InjectionToken,
  input,
  Renderer2,
  RendererStyleFlags2,
} from '@angular/core';
export interface BuludButtonLoaderTheme {
  readonly size?: string;
  readonly gap?: string;
  readonly stroke?: string;
  readonly foreground?: string;
  readonly muted?: string;
  readonly duration?: string;
}
export interface BuludInputBehaviorsConfig {
  readonly buttonLoader?: {
    readonly theme?: BuludButtonLoaderTheme;
    readonly defaults?: { readonly theme?: BuludButtonLoaderTheme };
  };
}
export const BULUD_INPUT_BEHAVIORS_CONFIG =
  new InjectionToken<BuludInputBehaviorsConfig>(
    'BULUD_INPUT_BEHAVIORS_CONFIG',
    { providedIn: 'root', factory: () => ({}) },
  );
/** Appends an indicator without disabling/replacing the native button or its content.
 * Import bulud-ng/input-behaviors.css explicitly for the indicator's styles. */
@Directive({ selector: '[buludButtonLoader]', standalone: true })
export class BuludButtonLoader {
  readonly loading = input(false, {
    alias: 'buludButtonLoader',
    transform: booleanAttribute,
  });
  readonly theme = input<BuludButtonLoaderTheme>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly config = inject(BULUD_INPUT_BEHAVIORS_CONFIG);
  constructor() {
    const indicator = this.renderer.createElement('i') as HTMLElement;
    this.renderer.setAttribute(
      indicator,
      'class',
      'bulud-button-loader__spinner',
    );
    this.renderer.setAttribute(indicator, 'aria-hidden', 'true');
    const properties = new Set<string>();
    afterRenderEffect(() => {
      for (const property of properties)
        this.renderer.removeStyle(
          indicator,
          property,
          RendererStyleFlags2.DashCase,
        );
      properties.clear();
      for (const layer of [
        this.config.buttonLoader?.theme,
        this.config.buttonLoader?.defaults?.theme,
        this.theme(),
      ])
        for (const [name, value] of Object.entries(layer ?? {}))
          if (value !== undefined) {
            const property = '--bulud-button-loader-' + name;
            this.renderer.setStyle(
              indicator,
              property,
              value,
              RendererStyleFlags2.DashCase,
            );
            properties.add(property);
          }
      if (this.loading()) {
        if (indicator.parentElement !== this.element.nativeElement)
          this.renderer.appendChild(this.element.nativeElement, indicator);
      } else indicator.remove();
    });
    inject(DestroyRef).onDestroy(() => indicator.remove());
  }
}
