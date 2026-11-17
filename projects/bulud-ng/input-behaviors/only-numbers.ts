import { Directive, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[buludOnlyNumbers]',
  standalone: true,
})
export class BuludOnlyNumbers {
  readonly decimalPlaces = input<number>();
  private control = inject(NgControl, { optional: true });

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const decimalPlaces = this.decimalPlaces();
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;

    let regex: RegExp;
    if (decimalPlaces)
      regex = new RegExp(`^\\d*(\\.\\d{0,${decimalPlaces}})?$`);
    else regex = new RegExp(`^\\d*?$`);
    if (!regex.test(value)) {
      const decimalIndex = value.indexOf('.');
      let newValue: string;

      if (decimalIndex >= 0 && decimalPlaces) {
        newValue = value.substring(0, decimalIndex + decimalPlaces + 1);
      } else {
        newValue = value.replace(/[^0-9]/g, '');
      }
      inputElement.value = newValue;
      this.control?.control?.setValue(newValue);
    }
  }
}
