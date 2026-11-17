import {
  afterRenderEffect,
  computed,
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
} from '@angular/core';
/** Fixed-format digit mask. It retains the append/delete-last editing contract. */
@Directive({ selector: 'input[buludInputMask]', standalone: true })
export class BuludInputMask {
  readonly maskTemplate = input('00 0000 0000 0000 0000 0000 00', {
    alias: 'buludInputMask',
  });
  readonly placeholder = input<string>();
  private rawValue = '';
  private automaticLabel: string | null = null;
  private readonly placeholderCount = computed(
    () => (this.maskTemplate().match(/0/g) ?? []).length,
  );
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  constructor() {
    afterRenderEffect(() => {
      this.el.nativeElement.placeholder =
        this.placeholder() ?? this.maskTemplate();
      const element = this.el.nativeElement;
      const currentLabel = element.getAttribute('aria-label');
      // An application-owned translated name or native label takes priority.
      if (
        !element.hasAttribute('aria-labelledby') &&
        !element.labels?.length &&
        (!currentLabel || currentLabel === this.automaticLabel)
      ) {
        this.automaticLabel = 'Input with mask format ' + this.maskTemplate();
        element.setAttribute('aria-label', this.automaticLabel);
      }
    });
  }
  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    const selectionStart = input.selectionStart ?? 0,
      oldValueLength = this.rawValue.length;
    const digits = input.value
      .replace(/\D/g, '')
      .substring(0, this.placeholderCount());
    this.rawValue = digits;
    input.value = this.applyMask(digits);
    this.adjustCaretPosition(selectionStart, oldValueLength, digits.length);
  }
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    const input = this.el.nativeElement,
      start = input.selectionStart ?? 0;
    event.preventDefault();
    this.rawValue = this.rawValue.substring(0, this.rawValue.length - 1);
    input.value = this.applyMask(this.rawValue);
    this.adjustCaretPosition(
      start - (event.key === 'Backspace' ? 1 : 0),
      this.rawValue.length + 1,
      this.rawValue.length,
    );
  }
  private applyMask(digits: string): string {
    if (!digits) {
      return '';
    }
    let result = '';
    let digitIndex = 0;

    for (let i = 0; i < this.maskTemplate().length; i++) {
      const char = this.maskTemplate()[i];
      if (char === '0') {
        result += digits[digitIndex] ?? ' ';
        digitIndex++;
      } else {
        result += char;
      }
    }

    return result;
  }

  private adjustCaretPosition(
    selectionStart: number,
    oldDigitCount: number,
    newDigitCount: number,
  ): void {
    const input = this.el.nativeElement;
    let caretPos = selectionStart;

    // If deleting, move caret back to account for removed digit
    if (newDigitCount < oldDigitCount) {
      // Find the previous valid position
      while (caretPos > 0 && this.maskTemplate()[caretPos - 1] !== '0') {
        caretPos--;
      }
    }
    // If inserting, move caret forward to account for mask characters
    else if (newDigitCount > oldDigitCount) {
      // Move caret past any non-placeholder characters (e.g., spaces)
      while (
        caretPos < this.maskTemplate().length &&
        this.maskTemplate()[caretPos] !== '0'
      ) {
        caretPos++;
      }
    }

    // Ensure caret is at a valid placeholder position
    if (caretPos < 0) {
      caretPos = this.maskTemplate().indexOf('0');
    } else if (caretPos >= this.maskTemplate().length) {
      caretPos = this.maskTemplate().lastIndexOf('0') + 1;
    }

    input.setSelectionRange(caretPos, caretPos);
  }
}
