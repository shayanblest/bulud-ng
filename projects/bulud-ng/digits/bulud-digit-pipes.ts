import { Pipe, PipeTransform } from '@angular/core';

export type BuludDigitPipeValue = string | number | null | undefined;

const ENGLISH_DIGITS = '0123456789';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Converts English digits to Persian digits and leaves all other text unchanged. */
@Pipe({
  name: 'buludPersianDigits',
  standalone: true,
  pure: true,
})
export class BuludPersianDigitsPipe implements PipeTransform {
  transform(value: BuludDigitPipeValue): string {
    return convertDigits(value, ENGLISH_DIGITS, PERSIAN_DIGITS);
  }
}

/** Converts Persian digits to English digits and leaves all other text unchanged. */
@Pipe({
  name: 'buludEnglishDigits',
  standalone: true,
  pure: true,
})
export class BuludEnglishDigitsPipe implements PipeTransform {
  transform(value: BuludDigitPipeValue): string {
    return convertDigits(value, PERSIAN_DIGITS, ENGLISH_DIGITS);
  }
}

function convertDigits(
  value: BuludDigitPipeValue,
  sourceDigits: string,
  targetDigits: string,
): string {
  if (value == null) {
    return '';
  }

  return String(value).replace(/[0-9۰-۹]/g, (digit) => {
    const sourceIndex = sourceDigits.indexOf(digit);
    return sourceIndex === -1 ? digit : targetDigits[sourceIndex];
  });
}
