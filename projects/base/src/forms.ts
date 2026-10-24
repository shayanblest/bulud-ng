import { BuludFieldLabel } from 'bulud-ng/field-label';
import { BuludTextarea } from 'bulud-ng/textarea';
import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
  AsyncValidatorFn,
} from '@angular/forms';
import { defer, of } from 'rxjs';
import { BuludButton } from 'bulud-ng/button';
import { BuludDropdown } from 'bulud-ng/dropdown';
import { BuludCheckbox } from 'bulud-ng/checkbox';
import { BuludSwitch } from 'bulud-ng/switch';
import { BuludRadio, BuludRadioGroup } from 'bulud-ng/radio';
import { BuludDatepicker, BuludDatepickerValue } from 'bulud-ng/datepicker';
import {
  buludRequiredText,
  buludFiniteNumber,
  buludHttpUrl,
  buludMatchFields,
} from 'bulud-ng/validators';
import { BasePreferences } from './preferences';
// Example-only async rule. Replace this Observable with your own API service.
const availableEmail: AsyncValidatorFn = (control) =>
  defer(() =>
    of(
      String(control.value).toLowerCase() === 'used@example.com'
        ? { emailTaken: true }
        : null,
    ),
  );
@Component({
  selector: 'base-forms',
  imports: [
    ReactiveFormsModule,
    BuludFieldLabel,
    BuludTextarea,
    BuludButton,
    BuludDropdown,
    BuludCheckbox,
    BuludSwitch,
    BuludRadio,
    BuludRadioGroup,
    BuludDatepicker,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forms.html',
})
export class BaseForms {
  readonly p = inject(BasePreferences);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly frameworks = ['angular', 'react', 'vue'];
  readonly form = this.fb.group(
    {
      name: [
        '',
        [buludRequiredText, Validators.minLength(2), Validators.maxLength(80)],
      ],
      email: [
        '',
        {
          validators: [
            Validators.required,
            Validators.email,
            Validators.maxLength(254),
          ],
          asyncValidators: [availableEmail],
        },
      ],
      website: ['', [buludHttpUrl, Validators.maxLength(2048)]],
      budget: [
        0,
        [
          Validators.required,
          buludFiniteNumber,
          Validators.min(0),
          Validators.max(1000000),
          Validators.pattern(/^\d+$/),
        ],
      ],
      key: [
        '',
        [buludRequiredText, Validators.pattern(/^[a-z][a-z0-9-]{2,23}$/)],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
        ],
      ],
      confirm: ['', Validators.required],
      plan: new FormControl<string | null>(null, Validators.required),
      frameworks: this.fb.control<readonly string[]>([], Validators.required),
      date: new FormControl<BuludDatepickerValue>(null, Validators.required),
      range: new FormControl<BuludDatepickerValue>(null),
      notes: ['', Validators.maxLength(500)],
      terms: [false, Validators.requiredTrue],
      notifications: [true],
    },
    { validators: buludMatchFields('password', 'confirm') },
  );
  private readonly events = toSignal(this.form.events, { initialValue: null });
  readonly attempted = signal(false);
  readonly success = signal(false);
  invalid(name: keyof typeof this.form.controls): boolean {
    this.events();
    const c = this.form.controls[name];
    return (
      (c.invalid ||
        (name === 'confirm' && this.form.hasError('matchFields'))) &&
      (c.touched || c.dirty || this.attempted())
    );
  }
  error(name: keyof typeof this.form.controls): string {
    this.events();
    const c = this.form.controls[name];
    const code =
      Object.keys(c.errors ?? {})[0] ??
      (name === 'confirm' && this.form.hasError('matchFields')
        ? 'matchFields'
        : '');
    const messages: Record<string, readonly [string, string]> = {
      required: ['این فیلد الزامی است.', 'This field is required.'],
      email: ['ایمیل معتبر وارد کنید.', 'Enter a valid email.'],
      emailTaken: [
        'این ایمیل در نمونه رزرو شده است.',
        'This email is reserved in the demo.',
      ],
      minlength: ['مقدار واردشده کوتاه است.', 'The value is too short.'],
      maxlength: [
        'مقدار واردشده بیش از حد طولانی است.',
        'The value is too long.',
      ],
      pattern: [
        'قالب مقدار واردشده صحیح نیست.',
        'The value has an invalid format.',
      ],
      url: [
        'یک آدرس کامل http یا https وارد کنید.',
        'Enter a complete http or https URL.',
      ],
      min: ['مقدار باید صفر یا بیشتر باشد.', 'Enter zero or a positive value.'],
      max: [
        'مقدار نباید بیشتر از ۱۰۰۰۰۰۰ باشد.',
        'The value must not exceed 1,000,000.',
      ],
      finiteNumber: ['عدد معتبر وارد کنید.', 'Enter a finite number.'],
      matchFields: [
        'رمز و تکرار آن یکسان نیستند.',
        'The passwords do not match.',
      ],
      minSelected: [
        'حداقل یک گزینه انتخاب کنید.',
        'Choose at least one option.',
      ],
      maxSelected: [
        'حداکثر دو گزینه انتخاب کنید.',
        'Choose at most two options.',
      ],
      option: [
        'یکی از گزینه‌های موجود را انتخاب کنید.',
        'Choose an available option.',
      ],
      dateRange: [
        'ابتدا و انتهای بازه را کامل کنید.',
        'Complete both range endpoints.',
      ],
    };
    const message = messages[code] ?? [
      'مقدار واردشده معتبر نیست.',
      'The value is invalid.',
    ];
    return this.p.text(message[0], message[1]);
  }
  status(): string {
    this.events();
    return this.form.pending
      ? this.p.text('در حال بررسی…', 'Checking…')
      : this.form.valid
        ? this.p.text('فرم معتبر است', 'Form is valid')
        : this.p.text('فرم نیاز به تکمیل دارد', 'Form needs attention');
  }
  submit(): void {
    this.attempted.set(true);
    this.success.set(false);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.form.pending) {
      for (const [name, c] of Object.entries(this.form.controls)) {
        if (
          c.invalid ||
          (name === 'confirm' && this.form.hasError('matchFields'))
        ) {
          const field = this.host.nativeElement.querySelector<HTMLElement>(
            `[formcontrolname="${name}"]`,
          );
          const target = field?.matches('input,textarea')
            ? field
            : field?.querySelector<HTMLElement>('button,input');
          target?.focus();
          break;
        }
      }
      return;
    }
    this.success.set(true);
  }
  reset(): void {
    this.form.reset();
    this.attempted.set(false);
    this.success.set(false);
  }
}
