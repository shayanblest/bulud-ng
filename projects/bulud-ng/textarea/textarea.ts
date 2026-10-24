import {
  booleanAttribute,
  computed,
  Directive,
  inject,
  input,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
/** Native textarea: Angular's native accessor/validators, labels and autosize directives remain usable. Import angour-base.css for its visual skin. */
@Directive({
  selector: 'textarea[buludTextarea]',
  host: {
    class: 'bulud-textarea',
    '[style]': 'styles()',
    '[attr.aria-invalid]': 'buludTextareaInvalid() || null',
  },
})
export class BuludTextarea {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  readonly buludTextareaInvalid = input(false, {
    transform: booleanAttribute,
  });
  protected readonly styles = computed(() =>
    buludSharedUiStyles('textarea', this.config, this.theme()),
  );
}
