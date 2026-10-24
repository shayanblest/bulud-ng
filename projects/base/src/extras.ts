import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BuludAvatar } from 'bulud-ng/avatar';
import { BuludEmptyState } from 'bulud-ng/empty-state';
import {
  BuludPeriodPicker,
  BuludPeriodValue,
  buludPeriodRange,
} from 'bulud-ng/period-picker';
import { BuludDonutChart, BuludProgress } from 'bulud-ng/charts';
import { BuludButton } from 'bulud-ng/button';
import { BuludCheckbox } from 'bulud-ng/checkbox';
import {
  BuludUnixTimeConverterPipe,
  buludTimeSlots,
  buludRemoveEmptyFields,
  buludSecondsUntil,
  buludShiftYears,
} from 'bulud-ng/utilities';
import { BasePreferences } from './preferences';
@Component({
  selector: 'base-extras',
  imports: [
    ReactiveFormsModule,
    BuludAvatar,
    BuludEmptyState,
    BuludPeriodPicker,
    BuludDonutChart,
    BuludProgress,
    BuludButton,
    BuludCheckbox,
    BuludUnixTimeConverterPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="surface">
    <div class="toolbar">
      <bulud-checkbox [(checked)]="loading">{{
        p.text('بارگذاری', 'Loading')
      }}</bulud-checkbox
      ><bulud-checkbox [(checked)]="empty">{{
        p.text('خالی', 'Empty')
      }}</bulud-checkbox
      ><bulud-checkbox [(checked)]="invalid">{{
        p.text('نامعتبر', 'Invalid')
      }}</bulud-checkbox
      ><bulud-checkbox [(checked)]="override">{{
        p.text('رنگ سفارشی', 'Custom theme')
      }}</bulud-checkbox>
    </div>
    <div class="grid">
      <bulud-donut-chart
        [caption]="p.text('توزیع نمونه', 'Example distribution')"
        [segments]="
          invalid() ? [{ label: 'Bad', value: -1 }] : empty() ? [] : segments
        "
        [loading]="loading()"
        [theme]="override() ? { accent: '#8040c0' } : undefined"
      />
      <div>
        <bulud-progress
          label="Progress"
          [value]="invalid() ? 101 : 65"
          [loading]="loading()"
          [theme]="override() ? { accent: '#8040c0' } : undefined"
        /><bulud-progress
          label="Ring progress"
          variant="ring"
          [value]="invalid() ? -1 : 65"
          [loading]="loading()"
          [theme]="override() ? { accent: '#8040c0' } : undefined"
        />
      </div>
    </div>
    <div class="toolbar">
      <bulud-avatar name="Bulud Library" /><bulud-avatar
        name="تصویر ناموجود"
        src="/missing-avatar-example.png"
        label="Broken image fallback"
      /><bulud-avatar
        name="Custom Avatar"
        [theme]="{ background: '#8040c0', foreground: '#fff' }"
      />
    </div>
    <bulud-empty-state
      [title]="p.text('داده‌ای پیدا نشد', 'No data found')"
      [description]="
        p.text(
          'فیلتر را تغییر دهید و دوباره تلاش کنید.',
          'Change your filters and try again.'
        )
      "
      ><bulud-button (click)="empty.set(false)">{{
        p.text('تلاش مجدد', 'Try again')
      }}</bulud-button></bulud-empty-state
    >
    <div class="grid">
      <div>
        <bulud-period-picker
          [label]="p.text('انتخاب ماه', 'Select month')"
          [language]="p.language()"
          [formControl]="month"
          required
          [invalid]="month.touched && month.invalid"
          [theme]="override() ? { accent: '#8040c0' } : undefined"
        />
        <p role="status">
          {{
            month.value
              ? range(month.value)
              : p.text('انتخاب ماه الزامی است', 'Month is required')
          }}
        </p>
      </div>
      <bulud-period-picker
        label="Year / سال"
        mode="year"
        [language]="p.language()"
        [(value)]="year"
      />
    </div>
    <div class="toolbar">
      <bulud-button (click)="month.disabled ? month.enable() : month.disable()"
        >Toggle disabled</bulud-button
      ><bulud-button (click)="month.reset(); month.markAsTouched()"
        >Reset period</bulud-button
      >
    </div>
    <h3>Utilities & pipes</h3>
    <p>
      Timestamp:
      {{ 1735689600 | buludUnixTimeConverter: 'yearly' : p.language() : 'UTC' }}
    </p>
    <p>
      {{ slots.length }} time slots · {{ slots[0].start }}–{{
        slots[slots.length - 1].end
      }}
    </p>
    <p>
      Preserved zero/false: {{ cleaned }} · Leap year clamp: {{ shifted }} ·
      Seconds until: {{ seconds }}
    </p>
  </section>`,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
      gap: 24px;
      margin-block: 24px;
    }
    bulud-empty-state {
      margin-block: 24px;
    }
  `,
})
export class BaseExtras {
  readonly p = inject(BasePreferences);
  readonly loading = signal(false);
  readonly empty = signal(false);
  readonly invalid = signal(false);
  readonly override = signal(false);
  readonly segments = [
    { label: 'First', value: 45 },
    { label: 'Second', value: 35 },
    { label: 'Third', value: 20 },
  ];
  readonly month = new FormControl<BuludPeriodValue | null>(null);
  readonly year = signal<BuludPeriodValue | null>(null);
  readonly range = (v: BuludPeriodValue) => JSON.stringify(buludPeriodRange(v));
  readonly slots = buludTimeSlots();
  readonly cleaned = JSON.stringify(
    buludRemoveEmptyFields({ zero: 0, enabled: false, empty: '' }),
  );
  readonly shifted = buludShiftYears(new Date('2024-02-29T12:00:00Z'), 1)
    ?.toISOString()
    .slice(0, 10);
  readonly seconds = buludSecondsUntil(100, 99000);
}
