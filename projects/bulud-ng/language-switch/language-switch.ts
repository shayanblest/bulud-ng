import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
import { BuludSymbol } from 'bulud-ng/symbol';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

import { BuludRuntime, BuludLanguageOption } from 'bulud-ng/runtime';

import { BuludDropdown } from 'bulud-ng/dropdown';

@Component({
  selector: 'bulud-language-switch',
  standalone: true,
  styleUrl: '../language-switch.css',
  host: { '[style]': 'styles()', '[class.bulud-standalone]': 'true' },
  imports: [BuludSymbol, BuludDropdown],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
    '<div class="relative">\n    <bulud-dropdown [inputId]="inputId()"\n      class="angour-dropdown lang-switch"\n      [options]="options()"\n      [value]="selected()"\n      (valueChange)="choose($event)"\n      [searchable]="false"\n      [clearable]="false"\n      [disabled]="!options().length"\n      [compareWith]="compare"\n      [optionLabel]="optionLabel"\n      ><ng-template #selectedTemplate let-language\n        ><div class="bulud-type-6 angour-dropdown-value">\n          @if (language) {\n            <bulud-symbol\n              [legacy]="legacyIcons()"\n              name="language"\n              legacyClass="icon-language bulud-type-1"\n            /><span class="bulud-margin-small-wide bulud-margin-x-2 bulud-margin-medium-wide">{{ language.label }}</span>\n          }\n        </div></ng-template\n      ><ng-template #optionTemplate let-language\n        ><div\n          class="bulud-language-option bulud-padding-3 flex justify-between items-center"\n        >\n          <span\n            class="bulud-margin-0 bulud-margin-e-3"\n            >{{ language.label }}</span\n          ></div></ng-template\n    ></bulud-dropdown>\n  </div>',
})
export class BuludLanguageSwitch {
  /** Project-owned native control identifier; no prefix normalization. */
  readonly inputId = input<string | null>(null);
  private readonly sharedConfig = inject(BULUD_SHARED_UI_CONFIG);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly styles = computed(() =>
    buludSharedUiStyles('language-switch', this.sharedConfig, this.theme()),
  );

  readonly legacyIcons = input(
    inject(BULUD_SHARED_UI_CONFIG).legacyIcons ?? false,
  );
  private readonly runtime = inject(BuludRuntime);
  readonly languages = input<readonly BuludLanguageOption[]>();
  readonly language = input<string>();
  readonly languageChange = output<string>();
  protected readonly options = computed(() => [
    ...(this.languages() ?? this.runtime.languages()),
  ]);
  protected readonly selected = computed(
    () =>
      this.options().find(
        (item) => item.code === (this.language() ?? this.runtime.language()),
      ) ??
      this.options()[0] ??
      null,
  );
  protected readonly compare = (
    a: BuludLanguageOption | null,
    b: BuludLanguageOption | null,
  ) => a?.code === b?.code;
  protected readonly optionLabel = (item: BuludLanguageOption) => item.label;
  constructor() {
    effect(() => {
      const code = this.selected()?.code;
      if (code) this.runtime.displayedLanguage(code);
    });
  }
  protected choose(
    value: BuludLanguageOption | readonly BuludLanguageOption[] | null,
  ): void {
    if (!value || !('code' in value)) return;
    this.runtime.setLanguage(value.code);
    this.languageChange.emit(value.code);
  }
}
