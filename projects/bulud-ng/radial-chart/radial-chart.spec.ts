import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludRadialChart } from './radial-chart';
import { BULUD_RADIAL_CHART_CONFIG } from './radial-chart.config';
describe('Native radial percentage', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  async function fixture() {
    const f = TestBed.createComponent(BuludRadialChart);
    f.componentRef.setInput('label', 'WinRate');
    f.componentRef.setInput('value', 65);
    await f.whenStable();
    return f;
  }
  it('retains the scalar percentage instead of normalizing one slice to 100%', async () => {
    const f = await fixture();
    expect(f.nativeElement.textContent).toContain('65%');
    expect(
      f.nativeElement
        .querySelector('path.bulud-radial-value')
        .getAttribute('d'),
    ).not.toBe(
      f.nativeElement
        .querySelector('path.bulud-radial-track')
        .getAttribute('d'),
    );
    expect(
      f.nativeElement.querySelector('[role=button]').getAttribute('aria-label'),
    ).toBe('WinRate: 65%');
  });
  it('reacts to exact values, zero/full rings, labels and arbitrary locales', async () => {
    const f = await fixture();
    for (const value of [0, 100, 33.333333, 66.6]) {
      f.componentRef.setInput('value', value);
      await f.whenStable();
      expect(
        f.nativeElement.querySelector('.bulud-radial-text').textContent.trim(),
      ).toBe(value + '%');
    }
    f.componentRef.setInput('label', 'میزان موفقیت');
    f.componentRef.setInput('value', 33.5);
    for (const locale of ['fa-IR', 'ar-EG', 'de-DE', 'tr-TR', 'ja-JP']) {
      f.componentRef.setInput('locale', locale);
      await f.whenStable();
      expect(
        f.nativeElement.querySelector('.bulud-radial-text').textContent.trim(),
      ).toBe(
        new Intl.NumberFormat(locale, {
          style: 'percent',
          maximumFractionDigits: 20,
        }).format(0.335),
      );
      expect(
        f.nativeElement.querySelector('.bulud-radial-label').textContent.trim(),
      ).toBe('میزان موفقیت');
    }
    f.componentRef.setInput('locale', 'invalid_locale');
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('.bulud-radial-text').textContent.trim(),
    ).toBe('33.5%');
  });
  it('preserves hover and toggle selection, with keyboard Enter/Space semantics', async () => {
    const f = await fixture();
    const path: SVGElement = f.nativeElement.querySelector(
      '.bulud-radial-value',
    );
    path.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    await f.whenStable();
    expect(path.getAttribute('filter')).toContain('-hover)');
    const events: boolean[] = [];
    f.componentInstance.selected.subscribe((value) => events.push(value));
    path.dispatchEvent(new MouseEvent('click'));
    await f.whenStable();
    expect(path.getAttribute('aria-pressed')).toBe('true');
    expect(path.getAttribute('filter')).toContain('-selected)');
    path.dispatchEvent(new PointerEvent('pointerleave'));
    await f.whenStable();
    expect(path.getAttribute('filter')).toContain('-selected)');
    for (const key of ['Enter', ' ']) {
      path.dispatchEvent(new KeyboardEvent('keydown', { key }));
      await f.whenStable();
    }
    expect(events).toEqual([true, false, true]);
  });
  it('ignores touch hover and disables keyboard and pointer changes without changing data', async () => {
    const f = await fixture();
    const path: SVGElement = f.nativeElement.querySelector(
      '.bulud-radial-value',
    );
    path.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'touch' }),
    );
    await f.whenStable();
    expect(path.getAttribute('filter')).toBeNull();
    f.componentRef.setInput('disabled', true);
    await f.whenStable();
    path.dispatchEvent(new MouseEvent('click'));
    path.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await f.whenStable();
    expect(path.getAttribute('tabindex')).toBeNull();
    expect(path.getAttribute('aria-pressed')).toBe('false');
    expect(f.componentInstance.value()).toBe(65);
  });
  it('shows named loading, error and empty states and rejects nonfinite/out-of-range data', async () => {
    const f = await fixture();
    for (const value of [-1, 101, NaN, Infinity]) {
      f.componentRef.setInput('value', value);
      await f.whenStable();
      expect(f.nativeElement.querySelector('svg')).toBeNull();
      expect(
        f.nativeElement.querySelector('[role=status]').textContent.trim(),
      ).toContain('Invalid');
    }
    f.componentRef.setInput('value', null);
    f.componentRef.setInput('emptyLabel', 'Aucune donnée');
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Aucune donnée');
    f.componentRef.setInput('loading', true);
    f.componentRef.setInput('loadingLabel', 'Chargement');
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Chargement');
    f.componentRef.setInput('loading', false);
    f.componentRef.setInput('error', true);
    f.componentRef.setInput('errorLabel', 'Erreur');
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Erreur');
  });
  it('resolves instance, component-default, global and CSS theme/locale precedence', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_RADIAL_CHART_CONFIG,
          useValue: {
            theme: { accent: 'red', track: 'gray' },
            locale: 'fa-IR',
            defaults: { locale: 'de-DE', theme: { accent: 'blue' } },
          },
        },
      ],
    });
    const f = await fixture();
    f.componentRef.setInput('value', 33.5);
    await f.whenStable();
    const host: HTMLElement = f.nativeElement;
    expect(host.style.getPropertyValue('--bulud-radial-accent')).toBe('blue');
    expect(host.style.getPropertyValue('--bulud-radial-track')).toBe('gray');
    expect(f.nativeElement.textContent).toContain('33,5');
    f.componentRef.setInput('theme', { accent: 'green' });
    f.componentRef.setInput('locale', 'en-US');
    await f.whenStable();
    expect(host.style.getPropertyValue('--bulud-radial-accent')).toBe('green');
    expect(f.nativeElement.textContent).toContain('33.5%');
    host.style.setProperty('--bulud-radial-foreground', 'rgb(12, 34, 56)');
    expect(getComputedStyle(f.nativeElement.querySelector('text')).fill).toBe(
      'rgb(12, 34, 56)',
    );
  });
  it('disconnects resize observation on destruction', async () => {
    const disconnect = spyOn(
      ResizeObserver.prototype,
      'disconnect',
    ).and.callThrough();
    const f = await fixture();
    f.destroy();
    expect(disconnect).toHaveBeenCalled();
  });
});
