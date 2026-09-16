import {
  Component,
  createEnvironmentInjector,
  EnvironmentInjector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideBuludTheme } from '../../src/lib/theme/bulud-theme';
import { BuludBadge } from './bulud-badge';

@Component({
  standalone: true,
  imports: [BuludBadge],
  template: `
    <bulud-badge
      [variant]="variant()"
      [size]="size()"
      [dot]="dot()"
      [dismissible]="dismissible()"
      [dismissLabel]="dismissLabel()"
      (dismissed)="dismissed = true"
    >
      Published
    </bulud-badge>
  `,
})
class HostComponent {
  dismissed = false;
  readonly variant = signal<
    'neutral' | 'primary' | 'success' | 'warning' | 'danger'
  >('success');
  readonly size = signal<'small' | 'medium' | 'large'>('medium');
  readonly dot = signal(true);
  readonly dismissible = signal(true);
  readonly dismissLabel = signal('Remove badge');
}

describe('BuludBadge', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
  });

  it('renders projected content and a status dot', () => {
    expect(fixture.nativeElement.textContent).toContain('Published');
    expect(
      fixture.nativeElement.querySelector('.bulud-badge__dot'),
    ).not.toBeNull();
  });

  it('emits when dismissed', () => {
    fixture.nativeElement.querySelector('.bulud-badge__dismiss').click();
    expect(fixture.componentInstance.dismissed).toBeTrue();
  });

  it('renders every supported variant and size reactively', async () => {
    for (const variant of [
      'neutral',
      'primary',
      'success',
      'warning',
      'danger',
    ] as const) {
      for (const size of ['small', 'medium', 'large'] as const) {
        fixture.componentInstance.variant.set(variant);
        fixture.componentInstance.size.set(size);
        await fixture.whenStable();
        const badge = fixture.nativeElement.querySelector('.bulud-badge');
        expect(badge.classList).toContain(`bulud-badge--${variant}`);
        expect(badge.classList).toContain(`bulud-badge--${size}`);
      }
    }
  });

  it('exposes a custom accessible dismiss name and hides the action when disabled', async () => {
    fixture.componentInstance.dismissLabel.set('Remove published badge');
    await fixture.whenStable();
    expect(
      fixture.nativeElement
        .querySelector('.bulud-badge__dismiss')
        ?.getAttribute('aria-label'),
    ).toBe('Remove published badge');

    fixture.componentInstance.dismissible.set(false);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.bulud-badge__dismiss'),
    ).toBeNull();
  });
  it('uses passive text semantics and a native non-submit dismiss action', () => {
    const host: HTMLElement = fixture.nativeElement;
    const badge = host.querySelector('.bulud-badge')!;
    const button = host.querySelector('button')!;
    expect(badge.tagName).toBe('SPAN');
    expect(badge.hasAttribute('role')).toBeFalse();
    expect(badge.hasAttribute('tabindex')).toBeFalse();
    expect(button.type).toBe('button');
    expect(button.querySelector('svg')!.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(
      host.querySelector('.bulud-badge__dot')!.getAttribute('aria-hidden'),
    ).toBe('true');
    const bubbled = jasmine.createSpy('parent click');
    host.addEventListener('click', bubbled);
    button.click();
    expect(bubbled).not.toHaveBeenCalled();
    expect(host.querySelector('button')).toBe(button);
  });

  it('keeps a nonempty dismiss name and updates the decorative dot reactively', async () => {
    fixture.componentInstance.dismissLabel.set('  ');
    fixture.componentInstance.dot.set(false);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('button').getAttribute('aria-label'),
    ).toBe('Remove badge');
    expect(fixture.nativeElement.querySelector('.bulud-badge__dot')).toBeNull();
  });

  it('renders every dot in its variant foreground', async () => {
    for (const variant of [
      'neutral',
      'primary',
      'success',
      'warning',
      'danger',
    ] as const) {
      fixture.componentInstance.variant.set(variant);
      await fixture.whenStable();
      const dot: HTMLElement =
        fixture.nativeElement.querySelector('.bulud-badge__dot');
      expect(getComputedStyle(dot).backgroundColor).toBe(
        getComputedStyle(dot).color,
      );
    }
  });

  it('resolves library, typed global, scoped component and instance theme precedence', () => {
    const host: HTMLElement =
      fixture.nativeElement.querySelector('bulud-badge');
    const badge = host.querySelector('.bulud-badge')!;
    const original = document.head.querySelector(
      'style[data-bulud-theme]',
    )?.textContent;
    const injector = createEnvironmentInjector(
      [
        provideBuludTheme({
          badge: { success: { background: '#123456' }, fontWeight: '700' },
        }),
      ],
      TestBed.inject(EnvironmentInjector),
    );
    try {
      expect(getComputedStyle(badge).backgroundColor).toBe('rgb(18, 52, 86)');
      expect(getComputedStyle(badge).fontWeight).toBe('700');
      expect(getComputedStyle(badge).color).toBe('rgb(21, 128, 61)');
      const scope: HTMLElement = fixture.nativeElement;
      scope.style.setProperty('--bulud-badge-success-background', '#234567');
      expect(getComputedStyle(badge).backgroundColor).toBe('rgb(35, 69, 103)');
      host.style.setProperty('--bulud-badge-success-background', '#345678');
      expect(getComputedStyle(badge).backgroundColor).toBe('rgb(52, 86, 120)');
      host.style.removeProperty('--bulud-badge-success-background');
      scope.style.removeProperty('--bulud-badge-success-background');
      expect(getComputedStyle(badge).backgroundColor).toBe('rgb(18, 52, 86)');
      document.head.querySelector('style[data-bulud-theme]')!.textContent = '';
      expect(getComputedStyle(badge).backgroundColor).toBe(
        'rgb(220, 252, 231)',
      );
    } finally {
      injector.destroy();
      const style = document.head.querySelector('style[data-bulud-theme]')!;
      if (original === undefined) style.remove();
      else style.textContent = original;
    }
  });
});
