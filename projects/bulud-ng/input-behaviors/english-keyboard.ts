import {
  Directive,
  ElementRef,
  afterRenderEffect,
  signal,
  HostListener,
  output,
  inject,
} from '@angular/core';

const PERSIAN_KEYBOARD_TO_ENGLISH_MAP: Record<string, string> = {
  ض: 'q',
  ص: 'w',
  ث: 'e',
  ق: 'r',
  ف: 't',
  غ: 'y',
  ع: 'u',
  ه: 'i',
  خ: 'o',
  ح: 'p',
  ج: '[',
  چ: ']',

  ش: 'a',
  س: 's',
  ی: 'd',
  ي: 'd',
  ب: 'f',
  ل: 'g',
  ا: 'h',
  ت: 'j',
  ن: 'k',
  م: 'l',
  ک: ';',
  ك: ';',
  گ: "'",

  ظ: 'z',
  ط: 'x',
  ز: 'c',
  ر: 'v',
  ذ: 'b',
  د: 'n',
  پ: 'm',
  و: ',',
  ئ: 'm',

  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',

  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

export function buludEnglishKeyboardValue(value: string): string {
  return value
    .split('')
    .map((char) => PERSIAN_KEYBOARD_TO_ENGLISH_MAP[char] ?? char)
    .join('')
    .toUpperCase();
}

@Directive({
  selector: 'input[buludEnglishKeyboard]',
  standalone: true,
})
export class BuludEnglishKeyboard {
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  readonly buludEnglishKeyboardChange = output<string>();
  private readonly cursor = signal<number | null>(null, { equal: () => false });
  constructor() {
    afterRenderEffect(() => {
      const cursor = this.cursor();
      if (cursor !== null)
        this.elementRef.nativeElement.setSelectionRange(cursor, cursor);
    });
  }

  @HostListener('input')
  onInput(): void {
    const input = this.elementRef.nativeElement;
    const cursorPosition = input.selectionStart ?? input.value.length;

    const normalizedValue = buludEnglishKeyboardValue(input.value);

    if (input.value !== normalizedValue) {
      input.value = normalizedValue;

      this.cursor.set(cursorPosition);
    }

    this.buludEnglishKeyboardChange.emit(normalizedValue);
  }
}
