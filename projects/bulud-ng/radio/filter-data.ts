import {
  DestroyRef,
  Directive,
  effect,
  HostListener,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import {BuludRadioGroup} from './bulud-radio/bulud-radio';
/** Scalar selection bridge; undefined denotes the configurable all-items sentinel. */
@Directive({ selector: 'bulud-radio-group[buludFilterData]', standalone: true })
export class BuludFilterData {
  private readonly group = inject(BuludRadioGroup);
  private writing = false;
  readonly allValue = input('__bulud_all__');
  readonly activeItem = input<string | null | undefined>();
  readonly itemChange = output<string | undefined>();
  constructor() {
    effect(() => {
      const value = this.activeItem(),
        all = this.allValue();
      untracked(() => {
        this.writing = true;
        this.group.value.set(value === undefined ? all : value);
        this.writing = false;
      });
    });
    const subscription = this.group.value.subscribe((value) => {
      if (!this.writing) this.emit(value as string);
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }
  private emit(value: string): void {
    this.itemChange.emit(value === this.allValue() ? undefined : value);
  }
  @HostListener('click', ['$event'])
  repeatSelection(event: MouseEvent): void {
    const input = event.target as HTMLInputElement;
    if (
      input.tagName === 'INPUT' &&
      input.type === 'radio' &&
      !input.disabled &&
      !this.group.isDisabled() &&
      input.value === this.group.value()
    )
      this.emit(input.value);
  }
}
