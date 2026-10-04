import { Pipe, PipeTransform } from '@angular/core';

export type BuludInitialsPipeValue = string | null | undefined;

const GRAPHEME_SEGMENTER = new Intl.Segmenter('und', {
  granularity: 'grapheme',
});

/**
 * Returns the first grapheme of each whitespace-delimited word, joined without
 * a separator. Unicode whitespace is trimmed and collapsed before splitting.
 */
@Pipe({
  name: 'buludInitials',
  standalone: true,
  pure: true,
})
export class BuludInitialsPipe implements PipeTransform {
  transform(value: BuludInitialsPipeValue): string {
    if (value == null) {
      return '';
    }

    const normalizedValue = value.replace(
      /^\p{White_Space}+|\p{White_Space}+$/gu,
      '',
    );
    if (normalizedValue === '') {
      return '';
    }

    return normalizedValue
      .split(/\p{White_Space}+/u)
      .map((word) => firstGrapheme(word))
      .join('');
  }
}

function firstGrapheme(value: string): string {
  for (const segment of GRAPHEME_SEGMENTER.segment(value)) {
    return segment.segment;
  }

  return '';
}
