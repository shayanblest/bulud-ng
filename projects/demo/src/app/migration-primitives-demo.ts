import { BuludCheckbox } from 'bulud-ng/checkbox';
import { BuludDropdown } from 'bulud-ng/dropdown';
import { BuludSwitch } from 'bulud-ng/switch';
import { migrationDemoText } from './migration-demo-translations';
import { BuludCarousel } from 'bulud-ng/carousel';

import { toSignal } from '@angular/core/rxjs-interop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BuludOtp } from 'bulud-ng/otp';
import {
  BuludInputMask,
  BuludOnlyNumbers,
  BuludNumberSeparator,
  BuludMaxLength,
  BuludInputFilter,
  BuludEnglishKeyboard,
  BuludButtonLoader,
} from 'bulud-ng/input-behaviors';
import { BuludAccess } from 'bulud-ng/access';
import { BuludTabPanel, BuludTabs, BuludTabHeading } from 'bulud-ng/tabs';
import { BuludStep, BuludStepper } from 'bulud-ng/stepper';
import { BuludCountdown } from 'bulud-ng/countdown';
import { BULUD_APPEARANCE_CONFIG, BuludAppearance } from 'bulud-ng/appearance';
import { BuludDateRangeService } from 'bulud-ng/date-range';
@Component({
  selector: 'app-migration-primitives-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BuludCheckbox,
    BuludDropdown,
    BuludSwitch,
    BuludCarousel,
    ReactiveFormsModule,
    BuludOtp,
    BuludInputMask,
    BuludOnlyNumbers,
    BuludNumberSeparator,
    BuludMaxLength,
    BuludInputFilter,
    BuludEnglishKeyboard,
    BuludButtonLoader,
    BuludAccess,
    BuludTabPanel,
    BuludTabs,
    BuludTabHeading,
    BuludStep,
    BuludStepper,
    BuludCountdown,
  ],
  providers: [
    {
      provide: BULUD_APPEARANCE_CONFIG,
      useValue: {
        themes: ['light', 'dark'],
        themeAttribute: 'data-demo-theme',
      },
    },
    BuludAppearance,
  ],
  template: `<section
    id="migration-primitives-demo"
    class="bulud-app bulud-migration-demo"
    data-bulud-preset="angour"
    [attr.data-theme]="appearance.theme()"
    [attr.lang]="language()"
    [style.--demo-accent]="accent()"
    [style.--bulud-color-primary]="accent()"
    [style.--demo-card-background]="cardBackground()"
    [dir]="direction()"
    [attr.data-demo-theme]="appearance.theme()"
    [style.--bulud-otp-border]="
      appearance.theme() === 'dark' ? '#64748b' : '#94a3b8'
    "
  >
    <h2 class="text-xl font-semibold">
      {{ t('Importable migration primitives') }}
    </h2>
    <div class="demo-toolbar">
      <label
        >{{ t('Project accent') }}
        <input
          aria-label="Project accent"
          type="color"
          [value]="accent() ?? '#0c2340'"
          (input)="accent.set($any($event.target).value)" /></label
      ><label
        >{{ t('Card background') }}
        <input
          aria-label="Card background"
          type="color"
          [value]="cardBackground() ?? '#0c2340'"
          (input)="cardBackground.set($any($event.target).value)"
      /></label>
    </div>
    <div class="demo-toolbar">
      <div class="demo-field">
        {{ t('Language')
        }}<bulud-dropdown
          class="demo-control"
          aria-label="Migration language"
          [options]="languages()"
          [formControl]="languageControl"
          [searchable]="false"
          [clearable]="false"
        />
      </div>
      <button
        class="demo-action"
        type="button"
        (click)="addLanguage()"
        aria-label="Add project language"
      >
        {{ t('Add project language') }}
      </button>
      <bulud-switch
        appearance="theme"
        [checked]="appearance.theme() === 'dark'"
        (checkedChange)="appearance.setTheme($event ? 'dark' : 'light')"
        aria-label="Cycle migration theme"
        >{{ t('Cycle widget theme') }}</bulud-switch
      ><output data-testid="theme-name">{{ appearance.theme() }}</output>
      <bulud-checkbox
        aria-label="Instance theme override"
        [checked]="override()"
        (checkedChange)="override.set($event)"
        >{{ t('Instance theme override') }}</bulud-checkbox
      >
    </div>
    <section class="space-y-3">
      <h3>{{ t('Separate OTP inputs') }}</h3>
      <div class="demo-field">
        {{ t('Length')
        }}<bulud-dropdown
          class="demo-control"
          aria-label="OTP length"
          [options]="[4, 6]"
          [value]="length()"
          (valueChange)="length.set(numberValue($event, length()))"
          [searchable]="false"
          [clearable]="false"
        />
      </div>
      <bulud-checkbox
        aria-label="Disable OTP"
        (checkedChange)="disabled($event)"
        >{{ t('Disable OTP') }}</bulud-checkbox
      >
      <bulud-checkbox
        aria-label="Invalid OTP"
        (checkedChange)="invalid.set($event)"
        >{{ t('Invalid OTP') }}</bulud-checkbox
      >
      <bulud-checkbox
        aria-label="Unstyled OTP"
        (checkedChange)="unstyled.set($event)"
        >{{ t('Unstyled OTP') }}</bulud-checkbox
      >
      <bulud-otp
        layout="separate"
        [label]="codeLabel()"
        required
        [length]="length()"
        [formControl]="code"
        [invalid]="invalid()"
        [unstyled]="unstyled()"
        [theme]="
          override()
            ? { gap: '13px', width: '44px', border: '#be285a' }
            : undefined
        "
        (completed)="completed.set($event)"
      />
      <button
        class="demo-action"
        type="button"
        (click)="otp().clear()"
        aria-label="Clear OTP"
      >
        {{ t('Clear OTP') }}</button
      ><output data-testid="otp-value">{{ code.value }}</output
      ><output data-testid="otp-completed">{{ completed() }}</output>
    </section>
    <section class="space-y-3">
      <h3>{{ t('Native input behaviors') }}</h3>
      <div class="demo-toolbar">
        <input aria-label="Digit mask" buludInputMask="00-00" />
        <input aria-label="Only numbers" buludOnlyNumbers [decimalPlaces]="2" />
        <input
          aria-label="Grouped number"
          buludNumberSeparator
          [formControl]="amount"
        />
        <input aria-label="Maximum length" [buludMaxLength]="3" />
        <input aria-label="Input filter" buludInputFilter="[A-Z]" />
        <input
          aria-label="English keyboard"
          buludEnglishKeyboard
          (buludEnglishKeyboardChange)="converted.set($event)"
        />
        <button
          class="demo-action"
          type="button"
          [buludButtonLoader]="loading()"
          [theme]="override() ? { size: '32px' } : undefined"
          (click)="loading.set(!loading())"
          aria-label="Toggle button loader"
        >
          {{ t('Toggle button loader') }}
        </button>
      </div>
      <output data-testid="grouped-value">{{ amount.value }}</output
      ><output data-testid="keyboard-value">{{ converted() }}</output>
    </section>
    <section class="space-y-3">
      <h3>{{ t('Application-owned permissions') }}</h3>
      <bulud-checkbox
        aria-label="Allow content"
        [checked]="allowed()"
        (checkedChange)="allowed.set($event)"
        >{{ t('Allow content') }}</bulud-checkbox
      >
      <p *buludAccess="allowed()" data-testid="protected-content">
        {{ t('Allowed projected content') }}
      </p>
    </section>
    <section class="space-y-3">
      <h3>{{ t('Projected tabs') }}</h3>
      <button
        class="demo-action"
        type="button"
        (click)="selection.set('permission-hidden')"
        aria-label="Select missing tab"
      >
        {{ t('Select missing tab') }}</button
      ><bulud-checkbox
        aria-label="Show protected tab"
        [checked]="allowed()"
        (checkedChange)="allowed.set($event)"
        >{{ t('Show protected tab') }}</bulud-checkbox
      >
      <bulud-tabs
        presentation="projected"
        aria-label="Migration sections"
        [activeId]="selection()"
        (tabChange)="selection.set($event); tabEvents.update(increment)"
        [theme]="override() ? { gap: '17px' } : undefined"
      >
        <section buludTabPanel="overview">
          <ng-template buludTabHeading>{{ t('Overview') }}</ng-template>
          <p>{{ t('Overview panel') }}</p>
        </section>
        @if (allowed()) {
          <section buludTabPanel="protected">
            <ng-template buludTabHeading>{{ t('Protected') }}</ng-template>
            <p>{{ t('Protected panel') }}</p>
          </section>
        }</bulud-tabs
      ><output data-testid="tab-events">{{ tabEvents() }}</output>
    </section>
    <section class="space-y-3">
      <h3>{{ t('Projected workflow') }}</h3>
      <bulud-stepper
        presentation="content"
        class="demo-workflow"
        [scrollCurrent]="false"
        ><div buludStep="identity" #identityStep="buludStep" class="step">
          <span class="step-thumb">
            @if (identityStep.state() === 'previous') {
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            } @else {
              1
            }</span
          ><span>{{ t('Identity step') }}</span>
        </div>
        <div class="bulud-step-connector" aria-hidden="true"></div>
        <div buludStep="address" #addressStep="buludStep" class="step">
          <span class="step-thumb">
            @if (addressStep.state() === 'previous') {
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            } @else {
              2
            }</span
          ><span>{{ t('Address step') }}</span>
        </div>
        <div class="bulud-step-connector" aria-hidden="true"></div>
        <div buludStep="confirm" #confirmStep="buludStep" class="step">
          <span class="step-thumb">
            @if (confirmStep.state() === 'previous') {
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            } @else {
              3
            }</span
          ><span>{{ t('Confirm step') }}</span>
        </div></bulud-stepper
      ><button
        class="demo-action"
        type="button"
        (click)="stepper().prevStep()"
        aria-label="Previous workflow step"
      >
        {{ t('Previous workflow step') }}</button
      ><button
        class="demo-action"
        type="button"
        (click)="stepper().nextStep()"
        aria-label="Next workflow step"
      >
        {{ t('Next workflow step') }}
      </button>
    </section>
    <section class="space-y-3">
      <h3>{{ t('Responsive projected carousels') }}</h3>
      <div class="demo-toolbar">
        <div class="demo-field">
          {{ t('Number of cards')
          }}<bulud-dropdown
            class="demo-control"
            aria-label="Number of cards"
            [options]="[1, 2, 3, 5, 8]"
            [value]="totalCards()"
            (valueChange)="totalCards.set(numberValue($event, totalCards()))"
            [searchable]="false"
            [clearable]="false"
          />
        </div>
        <div class="demo-field">
          {{ t('Visible cards')
          }}<bulud-dropdown
            class="demo-control"
            aria-label="Visible cards"
            [options]="[1, 2, 3, 4]"
            [value]="desktopCards()"
            (valueChange)="
              desktopCards.set(numberValue($event, desktopCards()))
            "
            [searchable]="false"
            [clearable]="false"
          />
        </div>
        <div class="demo-field">
          {{ t('Card gap')
          }}<bulud-dropdown
            class="demo-control"
            aria-label="Card gap"
            [options]="[0, 8, 12, 24]"
            [value]="cardGap()"
            (valueChange)="cardGap.set(numberValue($event, cardGap()))"
            [searchable]="false"
            [clearable]="false"
          />
        </div>
      </div>
      <bulud-carousel
        presentation="multi"
        label="Accounts carousel"
        [dir]="direction()"
        [config]="carouselConfig()"
        [theme]="{ cardGap: cardGap() + 'px' }"
      >
        @for (item of carouselCards(); track item) {
          <ng-template #carouselItem
            ><div class="demo-slide">
              {{ t('Account') }} {{ item }}
            </div></ng-template
          >
        }
      </bulud-carousel>
      <bulud-carousel
        presentation="scroll"
        label="Promotions carousel"
        [dir]="direction()"
        [defaultIndex]="1"
      >
        @for (item of [1, 2, 3]; track item) {
          <article class="demo-slide">{{ t('Promotion') }} {{ item }}</article>
        }
      </bulud-carousel>
    </section>
    <section class="space-y-3">
      <h3>{{ t('Unix countdown and date ranges') }}</h3>
      <bulud-countdown format="mm:ss" label="Remaining time"
        ><svg
          buludCountdownIcon
          class="mr-2 h-6 w-6"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v6l4 2" /></svg></bulud-countdown
      ><button
        class="demo-action"
        type="button"
        (click)="timer().start(now() + 62)"
        aria-label="Start countdown"
      >
        {{ t('Start countdown') }}</button
      ><button
        class="demo-action"
        type="button"
        (click)="timer().stop()"
        aria-label="Stop countdown"
      >
        {{ t('Stop countdown') }}</button
      ><output>{{ range.getDateRange('monthly').from }}</output>
    </section>
  </section>`,
})
export class MigrationPrimitivesDemo {
  protected readonly numberValue = (
    value: unknown,
    fallback: number,
  ): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  protected readonly stringValue = (
    value: unknown,
    fallback: string,
  ): string => (typeof value === 'string' ? value : fallback);
  readonly accent = signal<string | null>(null);
  readonly cardBackground = signal<string | null>(null);
  protected readonly t = (key: string) =>
    migrationDemoText(this.language(), key);
  readonly totalCards = signal(5);
  readonly desktopCards = signal(3);
  readonly cardGap = signal(12);
  readonly carouselCards = computed(() =>
    Array.from({ length: this.totalCards() }, (_, i) => i + 1),
  );
  readonly carouselConfig = computed(() => ({
    itemsPerSlide: this.desktopCards(),
    step: 1,
    sizes: { 600: { itemsPerSlide: 1 }, 1000: { itemsPerSlide: 2 } },
  }));
  readonly appearance = inject(BuludAppearance);
  readonly range = inject(BuludDateRangeService);
  readonly languageControl = new FormControl('en', { nonNullable: true });
  readonly language = toSignal(this.languageControl.valueChanges, {
    initialValue: 'en',
  });
  readonly languages = signal(['en', 'fa', 'ar', 'tr']);
  readonly direction = computed(() =>
    ['fa', 'ar'].includes(this.language()) ? 'rtl' : 'ltr',
  );
  readonly codeLabel = computed(() =>
    this.language() === 'fa'
      ? 'کد تأیید'
      : this.language() === 'ar'
        ? 'رمز التحقق'
        : this.language() === 'tr'
          ? 'Doğrulama kodu'
          : this.language() === 'de'
            ? 'Bestätigungscode'
            : 'Verification code',
  );
  readonly override = signal(false);
  readonly length = signal(4);
  readonly invalid = signal(false);
  readonly unstyled = signal(false);
  readonly code = new FormControl('');
  readonly completed = signal('');
  readonly converted = signal('');
  readonly amount = new FormControl<number | null>(null);
  readonly loading = signal(false);
  readonly allowed = signal(true);
  readonly selection = signal<string | undefined>(undefined);
  readonly tabEvents = signal(0);
  readonly increment = (value: number) => value + 1;
  readonly otp = viewChild.required(BuludOtp);
  readonly stepper = viewChild.required(BuludStepper);
  readonly timer = viewChild.required(BuludCountdown);
  addLanguage(): void {
    if (!this.languages().includes('de'))
      this.languages.update((values) => [...values, 'de']);
    this.languageControl.setValue('de');
  }
  disabled(disabled: boolean): void {
    if (disabled) this.code.disable();
    else this.code.enable();
  }
  now(): number {
    return Math.floor(Date.now() / 1000);
  }
}
