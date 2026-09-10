import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
  readonly variant = signal<'neutral' | 'primary' | 'success' | 'warning' | 'danger'>('success');
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
    fixture.detectChanges();
  });

  it('renders projected content and a status dot', () => {
    expect(fixture.nativeElement.textContent).toContain('Published');
    expect(fixture.nativeElement.querySelector('.bulud-badge__dot')).not.toBeNull();
  });

  it('emits when dismissed', () => {
    fixture.nativeElement.querySelector('.bulud-badge__dismiss').click();
    expect(fixture.componentInstance.dismissed).toBeTrue();
  });

  it('renders every supported variant and size reactively', () => {
    for (const variant of ['neutral', 'primary', 'success', 'warning', 'danger'] as const) {
      for (const size of ['small', 'medium', 'large'] as const) {
        fixture.componentInstance.variant.set(variant);
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        const badge = fixture.nativeElement.querySelector('.bulud-badge');
        expect(badge.classList).toContain(`bulud-badge--${variant}`);
        expect(badge.classList).toContain(`bulud-badge--${size}`);
      }
    }
  });

  it('exposes a custom accessible dismiss name and hides the action when disabled', () => {
    fixture.componentInstance.dismissLabel.set('Remove published badge');
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('.bulud-badge__dismiss')
        ?.getAttribute('aria-label'),
    ).toBe('Remove published badge');

    fixture.componentInstance.dismissible.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.bulud-badge__dismiss')).toBeNull();
  });
});
