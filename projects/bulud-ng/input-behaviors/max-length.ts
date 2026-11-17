import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
} from '@angular/core';

@Directive({
  selector: 'input[buludMaxLength]',
  standalone: true,
})
export class BuludMaxLength {
  readonly buludMaxLength = input.required<number>();
  readonly element: HTMLInputElement;
  private eRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  constructor() {
    this.element = this.eRef.nativeElement;
  }

  @HostListener('keypress', ['$event']) onKeypress(event: KeyboardEvent): void {
    const selectionRange =
      (this.element.selectionEnd ?? 0) - (this.element.selectionStart ?? 0);
    if (
      event.key == 'Backspace' ||
      event.key == 'Delete' ||
      selectionRange > 0
    ) {
      return;
    }
    const input = event.target as HTMLInputElement;
    const maxLength = this.buludMaxLength();

    if (input.value.length >= maxLength) {
      input.value = input.value.slice(0, maxLength);
      event.preventDefault();
    }
  }
}
