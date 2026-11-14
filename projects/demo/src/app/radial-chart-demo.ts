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
  imports: [BuludRadialChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section id="radial-chart-demo" class="space-y-4 p-6">
    <h2 class="text-xl font-bold">Radial percentage</h2>
    <label
      >State
      <select [value]="state()" (change)="setState($event)">
        @for (state of states; track state) {
          <option [value]="state">{{ state }}</option>
        }
      </select></label
    >
    <label
      >Locale (any BCP 47 tag)
      <input [value]="locale()" (input)="setLocale($event)"
    /></label>
    <label
      >Chart label <input [value]="label()" (input)="setLabel($event)"
    /></label>
    <button type="button" (click)="rtl.set(!rtl())">
      Toggle radial direction</button
    ><button type="button" (click)="override.set(!override())">
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
            ? { accent: 'rgb(190, 40, 90)', track: 'rgb(200, 200, 210)' }
            : undefined
        "
      />
    </div>
  </section>`,
})
export class RadialChartDemo {
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
