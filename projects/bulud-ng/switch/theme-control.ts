import { Directive, effect, inject, input } from '@angular/core';
import {BuludSwitch} from './bulud-switch/bulud-switch';
import { BuludAppearance } from 'bulud-ng/appearance';
/** Boolean control for two named themes. Multi-theme lists use BuludAppearance directly. */
@Directive({ selector: 'bulud-switch[buludThemeControl]', standalone: true })
export class BuludThemeControl {
  private readonly control = inject(BuludSwitch);
  private readonly appearance = inject(BuludAppearance);
  readonly activeTheme = input('dark');
  readonly inactiveTheme = input('light');
  constructor() {
    this.control.registerOnChange((value: boolean) =>
      this.appearance.setTheme(
        value ? this.activeTheme() : this.inactiveTheme(),
      ),
    );
    effect(() =>
      this.control.writeValue(this.appearance.theme() === this.activeTheme()),
    );
  }
}
