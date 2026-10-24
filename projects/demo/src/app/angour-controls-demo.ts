import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BuludCheckbox } from 'bulud-ng/checkbox';
import { BuludButton } from 'bulud-ng/button';
import {
  BuludRadio,
  BuludRadioGroup,
  type BuludRadioValue,
} from 'bulud-ng/radio';
import {
  BuludDatepicker,
  type BuludDatepickerValue,
} from 'bulud-ng/datepicker';

@Component({
  selector: 'app-angour-controls-demo',
  imports: [
    ReactiveFormsModule,
    BuludCheckbox,
    BuludButton,
    BuludRadio,
    BuludRadioGroup,
    BuludDatepicker,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      id="angour-controls"
      data-bulud-preset="angour"
      class="bulud-app bulud-stack"
      [attr.data-theme]="dark() ? 'dark' : 'light'"
      [attr.dir]="rtl() ? 'rtl' : 'ltr'"
      [attr.lang]="rtl() ? 'fa' : 'en'"
    >
      <h2>{{ rtl() ? 'فرم‌های انگور در Bulud' : 'Angour form controls' }}</h2>
      <div class="bulud-row">
        <bulud-button
          aria-label="Toggle controls theme"
          (click)="dark.set(!dark())"
          >{{ dark() ? 'Light' : 'Dark' }}</bulud-button
        >
        <bulud-button
          variant="secondary"
          aria-label="Toggle controls language"
          (click)="rtl.set(!rtl())"
          >{{ rtl() ? 'English / LTR' : 'فارسی / RTL' }}</bulud-button
        >
      </div>
      <section id="angour-checks" class="bulud-panel bulud-stack">
        <h3>{{ rtl() ? 'چک‌باکس و رادیوباتن' : 'Checkbox and radio' }}</h3>
        <div class="bulud-row">
          <bulud-checkbox id="angour-check" [formControl]="accepted" required>{{
            rtl() ? 'قوانین را می‌پذیرم' : 'Accept terms'
          }}</bulud-checkbox>
          <bulud-checkbox [checked]="true">{{
            rtl() ? 'انتخاب‌شده' : 'Checked'
          }}</bulud-checkbox>
          <bulud-checkbox [indeterminate]="true">Mixed</bulud-checkbox>
          <bulud-checkbox disabled>Disabled</bulud-checkbox>
          <bulud-checkbox invalid>Invalid</bulud-checkbox>
        </div>
        <p id="angour-plan-label">
          {{ rtl() ? 'انتخاب طرح' : 'Choose a plan' }}
        </p>
        <bulud-radio-group
          id="angour-radios"
          [formControl]="plan"
          required
          aria-labelledby="angour-plan-label"
        >
          <bulud-radio value="basic">{{
            rtl() ? 'پایه' : 'Basic'
          }}</bulud-radio>
          <bulud-radio value="pro">{{ rtl() ? 'حرفه‌ای' : 'Pro' }}</bulud-radio>
          <bulud-radio value="disabled" disabled>Disabled</bulud-radio>
        </bulud-radio-group>
        <output id="angour-plan">{{ plan.value || 'empty' }}</output>
        <bulud-radio-group aria-label="Invalid plan" invalid
          ><bulud-radio value="invalid">Invalid</bulud-radio></bulud-radio-group
        >
        <bulud-radio-group aria-label="Disabled plan" disabled
          ><bulud-radio value="disabled"
            >Disabled group</bulud-radio
          ></bulud-radio-group
        >
        <bulud-radio-group
          aria-label="Custom plan"
          style="--bulud-radio-checked: #7c3aed"
          value="custom"
          ><bulud-radio value="custom"
            >Custom theme</bulud-radio
          ></bulud-radio-group
        >
        <div class="bulud-row">
          <bulud-button
            variant="secondary"
            (click)="plan.reset(); accepted.reset()"
            aria-label="Reset controls"
            >Reset</bulud-button
          >
          <bulud-button
            variant="secondary"
            (click)="toggleDisabled()"
            aria-label="Disable controls"
            >Disable / enable</bulud-button
          >
        </div>
      </section>
      <section id="datepicker-states" class="bulud-panel bulud-stack">
        <h3>{{ rtl() ? 'انتخاب تاریخ و بازه' : 'Date and range picker' }}</h3>
        <p class="bulud-muted">
          {{
            rtl()
              ? 'نمایش شمسی و میلادی، خروجی ثابت ISO. محدودهٔ انتخاب بازه: ۲۰۲۵/۰۳/۰۱ تا ۲۰۲۵/۰۴/۳۰'
              : 'Persian/Gregorian display, stable ISO values. Range picker bounds: 2025-03-01 to 2025-04-30.'
          }}
        </p>
        <label for="angour-date">{{ rtl() ? 'تاریخ' : 'Date' }}</label>
        <bulud-datepicker
          id="angour-date"
          [formControl]="date"
          [language]="rtl() ? 'fa' : 'en'"
          required
          min="1900-01-01"
          max="2100-12-31"
          [aria-label]="rtl() ? 'تاریخ نمونه' : 'Example date'"
        />
        <output id="angour-date-value">{{ date.value || 'empty' }}</output>
        <label for="angour-range">{{
          rtl() ? 'بازهٔ تاریخ' : 'Date range'
        }}</label>
        <bulud-datepicker
          id="angour-range"
          mode="range"
          [formControl]="range"
          [language]="rtl() ? 'fa' : 'en'"
          required
          min="2025-03-01"
          max="2025-04-30"
          [aria-label]="rtl() ? 'بازه نمونه' : 'Example range'"
        />
        <output id="angour-range-value">{{
          range.value ? range.value.toString() : 'empty'
        }}</output>
        <div class="bulud-row">
          <bulud-datepicker
            aria-label="Bounded date"
            calendar="gregory"
            language="en"
            value="2025-03-21"
            min="2025-03-15"
            max="2025-03-25"
          />
          <bulud-datepicker
            aria-label="Disabled date"
            disabled
            value="2025-03-21"
          />
          <bulud-datepicker
            aria-label="Invalid date"
            invalid
            value="2025-02-30"
          />
          <bulud-datepicker
            aria-label="Empty date"
            [language]="rtl() ? 'fa' : 'en'"
          />
          <bulud-datepicker
            aria-label="Custom date"
            calendar="gregory"
            language="en"
            value="2025-03-21"
            [theme]="{ selectedBackground: '#7c3aed' }"
            [style.--bulud-datepicker-selected-background]="'#15375b'"
          />
        </div>
        <div class="bulud-row">
          <bulud-button
            variant="secondary"
            (click)="date.reset(); range.reset()"
            aria-label="Reset dates"
            >Reset dates</bulud-button
          >
          <bulud-button
            variant="secondary"
            (click)="date.markAsTouched(); range.markAsTouched()"
            aria-label="Validate dates"
            >Validate</bulud-button
          >
        </div>
      </section>
    </section>
  `,
})
export class AngourControlsDemo {
  protected readonly rtl = signal(true);
  protected readonly dark = signal(false);
  protected readonly accepted = new FormControl(false, { nonNullable: true });
  protected readonly plan = new FormControl<BuludRadioValue | null>(null);
  protected readonly date = new FormControl<BuludDatepickerValue>('2025-03-21');
  protected readonly range = new FormControl<BuludDatepickerValue>(null);
  protected toggleDisabled(): void {
    for (const control of [this.plan, this.accepted, this.date, this.range]) {
      if (control.disabled) control.enable();
      else control.disable();
    }
  }
}
