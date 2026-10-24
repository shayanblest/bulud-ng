import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  InputSignal,
} from '@angular/core';
import { AbstractControl, Validators } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, switchMap } from 'rxjs';
import { buludRequiredText } from 'bulud-ng/validators';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
/** Bind a real label/legend to the model's required metadata; validators are never probed with fake values. */
@Component({
  selector:
    'label[buludFieldLabel],legend[buludFieldLabel],span[buludFieldLabel]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style]': 'styles()',
    '[class.bulud-field-required]': 'isRequired()',
  },
  template: `<ng-content />
    @if (isRequired()) {
      <span class="marker" aria-hidden="true"> *</span>
    }`,
  styles: `
    :host {
      color: var(--bulud-field-label-foreground, var(--bulud-color-on-surface));
    }
    .marker {
      color: var(
        --bulud-field-label-accent,
        var(--bulud-color-danger-text, var(--bulud-color-danger))
      );
      font-weight: var(--bulud-field-label-weight, 600);
    }
  `,
})
export class BuludFieldLabel {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly control: InputSignal<AbstractControl | null> =
    input<AbstractControl | null>(null);
  /** Explicit override for template-driven/custom opaque validator policies. */
  readonly required = input<boolean | undefined>(undefined);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  private readonly events = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) => control?.events ?? EMPTY),
    ),
    { initialValue: null },
  );
  protected readonly isRequired = computed(() => {
    this.events();
    const control = this.control();
    return (
      this.required() ??
      (!!control &&
        (control.hasValidator(Validators.required) ||
          control.hasValidator(Validators.requiredTrue) ||
          control.hasValidator(buludRequiredText)))
    );
  });
  protected readonly styles = computed(() =>
    buludSharedUiStyles('field-label', this.config, this.theme()),
  );
}
