import {
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  Renderer2,
  input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[buludNumberSeparator]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BuludNumberSeparator),
      multi: true,
    },
  ],
})
export class BuludNumberSeparator implements ControlValueAccessor {
  readonly decimalPlaces = input(2);

  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: number | string | null): void {
    this.renderer.setProperty(
      this.element.nativeElement,
      'value',
      this.format(String(value ?? '')),
    );
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.renderer.setProperty(this.element.nativeElement, 'disabled', disabled);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  @HostListener('input')
  onInput(): void {
    const input = this.element.nativeElement;
    const raw = this.sanitize(input.value);
    const start = this.sanitize(
      input.value.slice(0, input.selectionStart ?? input.value.length),
    ).length;
    const end = this.sanitize(
      input.value.slice(0, input.selectionEnd ?? input.value.length),
    ).length;
    const formatted = this.format(raw);

    this.renderer.setProperty(input, 'value', formatted);
    input.setSelectionRange(
      this.caretPosition(formatted, start),
      this.caretPosition(formatted, end),
    );
    this.onChange(raw && raw !== '.' ? Number(raw) : null);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.skipSeparator(event.key === 'Backspace');
    }
  }

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(event: InputEvent): void {
    if (
      event.inputType === 'deleteContentBackward' ||
      event.inputType === 'deleteContentForward'
    ) {
      this.skipSeparator(event.inputType === 'deleteContentBackward');
    }
  }

  private skipSeparator(backward: boolean): void {
    const input = this.element.nativeElement;
    const start = input.selectionStart;
    if (start === null || start !== input.selectionEnd) return;

    // Let the browser delete a digit when the caret is next to a display-only comma.
    if (backward && input.value[start - 1] === ',') {
      input.setSelectionRange(start - 1, start - 1);
    } else if (!backward && input.value[start] === ',') {
      input.setSelectionRange(start + 1, start + 1);
    }
  }

  private sanitize(value: string): string {
    const cleaned = value.replace(/[^\d.]/g, '');
    const dot = cleaned.indexOf('.');
    if (dot === -1) return cleaned;

    const whole = cleaned.slice(0, dot);
    if (this.decimalPlaces() === 0) return whole;

    return `${whole}.${cleaned
      .slice(dot + 1)
      .replace(/\./g, '')
      .slice(0, this.decimalPlaces())}`;
  }

  private format(value: string): string {
    const [whole, fraction] = value.split('.');
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return fraction === undefined ? grouped : `${grouped}.${fraction}`;
  }

  private caretPosition(formatted: string, digitOffset: number): number {
    let position = 0;
    let offset = 0;
    while (position < formatted.length && offset < digitOffset) {
      if (formatted[position] !== ',') offset++;
      position++;
    }
    return position;
  }
}
