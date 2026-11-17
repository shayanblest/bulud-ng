import { Directive, HostListener, input } from '@angular/core';

@Directive({
  selector: 'input[buludInputFilter]',
  standalone: true,
})
export class BuludInputFilter {
  readonly buludInputFilter = input.required<string>();

  @HostListener('input', ['$event'])
  onInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const initialValue = input.value;

    input.value = initialValue.replace(this.buludInputFilter(), '');
    if (initialValue !== input.value) {
      e.stopPropagation();
    }
  }

  @HostListener('keypress', ['$event']) onKeyPress(e: KeyboardEvent): void {
    const regex = new RegExp(this.buludInputFilter());
    if (!regex.test(e.key)) {
      e.preventDefault();
    }
  }
}
