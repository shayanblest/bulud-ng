import { effect, signal } from '@angular/core';
import { BuludDefault404Image } from 'bulud-ng/default-404-image';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  InjectionToken,
  input,
  output,
} from '@angular/core';

import { BuludRuntime } from 'bulud-ng/runtime';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';

export interface BuludEmptyStateConfig {
  readonly image?: string;
  readonly title?: string | (() => string);
  readonly actionLabel?: string | (() => string);
  readonly defaults?: {
    readonly image?: string;
    readonly title?: string | (() => string);
    readonly actionLabel?: string | (() => string);
  };
  readonly onAction?: () => void;
}
export const BULUD_EMPTY_STATE_CONFIG =
  new InjectionToken<BuludEmptyStateConfig>(
    'BULUD_EMPTY_STATE_CONFIG',
    { providedIn: 'root', factory: () => ({}) },
  );
@Component({
  selector: 'bulud-empty-state',
  standalone: true,
  imports: [BuludDefault404Image],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './empty-state.css',
  host: {
    '[style]': 'styles()',
    '[class.bulud-standalone]': "variant()==='illustrated'",
  },
  template: "@if(variant()==='illustrated'){<div class=\"background\">\n  <div class=\"bulud-illustration-layout flex bulud-center-wide content-center justify-center\">\n    <div class=\"bulud-column-half-wide bulud-column-full text-center bulud-hide-wide bulud-margin-b-8\">\n      @if(imageUrl();as source){<img [src]=\"source\" [alt]=\"imageAlt()\" (error)=\"imageFailed.set(true)\" class=\"bulud-image-large bulud-image-medium-wide mx-auto\">}@else{@defer(on immediate){<bulud-default-404-image [alt]=\"imageAlt()\" class=\"bulud-image-large bulud-image-medium-wide mx-auto\"/>}}\n    </div>\n    <div class=\"bulud-column-half-wide bulud-column-full text-center\">\n      <h1 class=\"mx-auto text text-center\">{{resolvedTitle()}}</h1>\n      <button class=\"bulud-action bulud-margin-t-4 mx-auto bulud-padding-x-4 font-bold bulud-type-4 bulud-action\"\n              type=\"button\" (click)=\"activate()\">\n        {{resolvedActionLabel()}}</button>\n    </div>\n    <div class=\"bulud-column-half-wide bulud-column-full text-center hidden bulud-flex-wide\">\n      @if(imageUrl();as source){<img [src]=\"source\" [alt]=\"imageAlt()\" (error)=\"imageFailed.set(true)\" class=\"bulud-image-medium mx-auto\">}@else{@defer(on immediate){<bulud-default-404-image [alt]=\"imageAlt()\" class=\"bulud-image-medium mx-auto\"/>}}\n    </div>\n  </div>\n</div>\n}@else{<section [attr.aria-label]=\"resolvedTitle()\">\n    <div class=\"icon\" aria-hidden=\"true\">\n      <svg viewBox=\"0 0 64 64\" focusable=\"false\">\n        <path d=\"M12 9h30l10 10v36H12Zm30 0v12h10M22 33h20M22 42h13\" /></svg\n      ><ng-content select=\"[buludEmptyIcon]\" />\n    </div>\n    <h3>{{ resolvedTitle() }}</h3>\n    @if (description()) {\n      <p>{{ description() }}</p>\n    }\n    <div class=\"actions\"><ng-content /></div>\n  </section>}",
})
export class BuludEmptyState {
  private readonly config = inject(BULUD_EMPTY_STATE_CONFIG);
  private readonly runtime = inject(BuludRuntime);
  readonly variant=input<'notice'|'illustrated'>('notice');
  readonly description=input('');
  readonly image = input<string | null>();
  readonly title = input<string>();
  readonly actionLabel = input<string>();
  readonly imageAlt = input('');
  readonly legacyIcons = input(
    inject(BULUD_SHARED_UI_CONFIG).legacyIcons ?? false,
  );
  protected readonly imageFailed = signal(false);
  protected readonly imageUrl = computed(() => {
    const image =
      this.image() ?? this.config.defaults?.image ?? this.config.image;
    return !this.imageFailed() && image?.trim() ? image : null;
  });
  constructor() {
    effect(() => {
      this.image();
      this.imageFailed.set(false);
    });
  }
  private resolve(
    value: string | (() => string) | undefined,
    fallback: string,
  ): string {
    return typeof value === 'function' ? value() : (value ?? fallback);
  }
  protected readonly resolvedTitle = computed(() => {
    this.runtime.text('', '');
    return (
      this.title() ??
      this.resolve(this.config.defaults?.title ?? this.config.title, this.variant()==='illustrated'?'404':'No content')
    );
  });
  protected readonly resolvedActionLabel = computed(() => {
    this.runtime.text('', '');
    return (
      this.actionLabel() ??
      this.resolve(
        this.config.defaults?.actionLabel ?? this.config.actionLabel,
        'Home',
      )
    );
  });
  readonly action = output<void>();
  private readonly sharedConfig = inject(BULUD_SHARED_UI_CONFIG);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly styles = computed(() =>
    buludSharedUiStyles('empty-state', this.sharedConfig, this.theme()),
  );
  activate(): void {
    this.action.emit();
    this.config.onAction?.();
  }
}
