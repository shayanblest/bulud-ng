import { DOCUMENT, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createBuludThemeVariables,
  provideBuludTheme,
  resolveBuludTheme,
} from './bulud-theme';

describe('Radio and Datepicker theme configuration', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  afterEach(() => {
    TestBed.inject(DOCUMENT)
      .head.querySelector('style[data-bulud-theme]')
      ?.remove();
  });
  it('resolves nested caller overrides and leaves other defaults intact', () => {
    const theme = resolveBuludTheme({
      radio: { dotSize: '10px' },
      datepicker: { daySize: '40px' },
    });
    expect(theme.radio.size).toBe('16px');
    expect(theme.radio.dotSize).toBe('10px');
    expect(theme.datepicker.daySize).toBe('40px');
    expect(
      createBuludThemeVariables({
        datepicker: { selectedBackground: '#123456' },
      })['--bulud-datepicker-selected-background'],
    ).toBe('#123456');
  });
  it('does not pin omitted feature defaults, and writes explicit geometry and dark colors', () => {
    TestBed.configureTestingModule({
      providers: [
        provideBuludTheme({
          radio: { size: '22px', checked: '#123456' },
          datepicker: {
            daySize: '40px',
            selectedBackground: '#654321',
            yearBackground: '#112233',
            rangeEndpointBackground: '#345678',
          },
        }),
      ],
    });
    const style = TestBed.inject(DOCUMENT).head.querySelector(
      'style[data-bulud-theme]',
    )!.textContent!;
    expect(style).toContain('--bulud-radio-size: 22px');
    expect(style).not.toContain('--bulud-radio-dot-size:');
    const dark = style.slice(style.indexOf(':root.dark'));
    expect(dark).toContain('--bulud-radio-checked: #123456');
    expect(dark).toContain('--bulud-datepicker-selected-background: #654321');
    expect(dark).toContain('--bulud-datepicker-year-background: #112233');
    expect(dark).toContain(
      '--bulud-datepicker-range-endpoint-background: #345678',
    );
    expect(style).not.toContain('--bulud-datepicker-muted:');
  });
});
