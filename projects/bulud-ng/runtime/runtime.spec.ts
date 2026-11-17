import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BULUD_RUNTIME_CONFIG,
  BuludLanguageOption,
  BuludRuntime,
} from './runtime';
describe('BuludRuntime dynamic project context', () => {
  it('supports a new locale, changing direction, translator revisions and an arbitrary locale list', () => {
    const language = signal('en'),
      direction = signal<'ltr' | 'rtl'>('ltr'),
      languages = signal<readonly BuludLanguageOption[]>([]),
      revision = signal(0),
      selected: string[] = [];
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_RUNTIME_CONFIG,
          useValue: {
            language,
            direction,
            languages,
            translationRevision: revision,
            translate: (key: string) =>
              key === 'code' ? language() + ' code ' + revision() : key,
            setLanguage: (code: string) => selected.push(code),
          },
        },
      ],
    });
    const context = TestBed.inject(BuludRuntime);
    expect(context.text('missing', 'Fallback')).toBe('Fallback');
    expect(context.text('code', 'Code')).toBe('en code 0');
    languages.set([
      { code: 'custom', label: 'Project locale', direction: 'rtl' },
    ]);
    language.set('custom');
    direction.set('rtl');
    revision.set(1);
    expect(context.language()).toBe('custom');
    expect(context.direction()).toBe('rtl');
    expect(context.languages()[0].code).toBe('custom');
    expect(context.text('code', 'Code')).toBe('custom code 1');
    context.setLanguage('custom');
    expect(selected).toEqual(['custom']);
  });
});
