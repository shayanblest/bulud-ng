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

    const words = value.trim().split(/\s+/u);
    if (words.length === 1 && words[0] === '') {
      return '';
    }

    return words.map((word) => firstGrapheme(word)).join('');
  }
}

function firstGrapheme(value: string): string {
  for (const segment of GRAPHEME_SEGMENTER.segment(value)) {
    return segment.segment;
  }

  return '';
}
