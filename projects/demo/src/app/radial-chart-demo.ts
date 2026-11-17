import { BuludDropdown } from 'bulud-ng/dropdown';
import { BuludSwitch } from 'bulud-ng/switch';
import { migrationDemoText } from './migration-demo-translations';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { BuludRadialChart } from 'bulud-ng/radial-chart';
@Component({
  selector: 'app-radial-chart-demo',
  standalone: true,
  imports: [BuludDropdown, BuludSwitch, BuludRadialChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section
    id="radial-chart-demo"
    class="bulud-app bulud-migration-demo"
    data-bulud-preset="angour"
    [attr.data-theme]="dark() ? 'dark' : 'light'"
    [attr.dir]="rtl() ? 'rtl' : 'ltr'"
    [attr.lang]="locale() || 'en'"
    [style.--demo-accent]="accent()"
    [style.--bulud-color-primary]="accent()"
  >
    <h2 class="text-xl font-bold">{{ t('Radial percentage') }}</h2>
    <div class="demo-toolbar">
      <bulud-switch
        appearance="theme"
        [checked]="dark()"
        (checkedChange)="dark.set($event)"
        aria-label="Chart dark theme"
        >{{ t('Cycle widget theme') }}</bulud-switch
      ><label
        >{{ t('Project accent') }}
        <input
          type="color"
          aria-label="Chart accent"
          [value]="accent() ?? '#0c2340'"
          (input)="accent.set($any($event.target).value); override.set(true)"
      /></label>
    </div>
    <div class="demo-field">
      State
      <bulud-dropdown
        class="demo-control"
        aria-label="Chart state"
        [options]="states"
        [value]="state()"
        (valueChange)="state.set(stringValue($event, state()))"
        [searchable]="false"
        [clearable]="false"
      />
    </div>
    <label
      >Locale (any BCP 47 tag)
      <input [value]="locale()" (input)="setLocale($event)"
    /></label>
    <label
      >Chart label <input [value]="label()" (input)="setLabel($event)"
    /></label>
    <button class="demo-action" type="button" (click)="rtl.set(!rtl())">
      Toggle radial direction</button
    ><button
      class="demo-action"
      type="button"
      (click)="override.set(!override())"
    >
      Toggle radial theme
    </button>
    <div class="w-full max-w-[400px]" [dir]="rtl() ? 'rtl' : 'ltr'">
      <bulud-radial-chart
        [label]="label()"
        [value]="value()"
        [locale]="locale() || undefined"
        [loading]="state() === 'loading'"
        [error]="state() === 'error'"
        [disabled]="state() === 'disabled'"
        [theme]="
          override()
            ? {
                accent: accent() ?? 'var(--bulud-color-primary)',
                track: 'var(--bulud-color-border)',
              }
            : undefined
        "
      />
    </div>
  </section>`,
})
export class RadialChartDemo {
  protected readonly numberValue = (
    value: unknown,
    fallback: number,
  ): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  protected readonly stringValue = (
    value: unknown,
    fallback: string,
  ): string => (typeof value === 'string' ? value : fallback);
  readonly dark = signal(false);
  readonly accent = signal<string | null>(null);
  protected readonly t = (key: string) =>
    migrationDemoText(this.locale() || 'en', key);
  readonly states = [
    'default',
    'zero',
    'full',
    'fractional',
    'empty',
    'loading',
    'error',
    'invalid',
    'disabled',
  ];
  readonly state = signal('default');
  readonly locale = signal('');
  readonly label = signal('WinRate');
  readonly rtl = signal(false);
  readonly override = signal(false);
  readonly value = computed(() =>
    this.state() === 'zero'
      ? 0
      : this.state() === 'full'
        ? 100
        : this.state() === 'fractional'
          ? 33.5
          : this.state() === 'empty'
            ? null
            : this.state() === 'invalid'
              ? NaN
              : 65,
  );
  setState(event: Event): void {
    this.state.set((event.target as HTMLSelectElement).value);
  }
  setLocale(event: Event): void {
    this.locale.set((event.target as HTMLInputElement).value);
  }
  setLabel(event: Event): void {
    this.label.set((event.target as HTMLInputElement).value);
  }
}
