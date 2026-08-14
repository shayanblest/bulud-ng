import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BuludButton,
  BuludButtonSize,
  BuludButtonVariant,
} from './bulud-button';

@Component({
  imports: [BuludButton],
  template: `
    <bulud-button
      aria-label="Save changes"
      [disabled]="disabled()"
      [fullWidth]="fullWidth()"
      [loading]="loading()"
      [loadingLabel]="loadingLabel()"
      [size]="size()"
      [variant]="variant()"
      (click)="clickCount.set(clickCount() + 1)"
    >
      Save
    </bulud-button>
  `,
})
class TestHost {
  readonly clickCount = signal(0);
  readonly disabled = signal(false);
  readonly fullWidth = signal(false);
  readonly loading = signal(false);
  readonly loadingLabel = signal('Saving');
  readonly size = signal<BuludButtonSize>('medium');
  readonly variant = signal<BuludButtonVariant>('primary');
}

describe('BuludButton', () => {
  let fixture: ComponentFixture<TestHost>;

  const getHost = (): HTMLElement => {
    const host = fixture.nativeElement.querySelector('bulud-button');

    if (!(host instanceof HTMLElement)) {
      throw new Error('Expected a bulud-button host element.');
    }

    return host;
  };

  const getButton = (): HTMLButtonElement => {
    const button = fixture.nativeElement.querySelector('button');

    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('Expected a native button element.');
    }

    return button;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  it('renders projected content in a native button', () => {
    const button = getButton();

    expect(button.type).toBe('button');
    expect(button.textContent).toContain('Save');
    expect(button.getAttribute('aria-label')).toBe('Save changes');
  });

  it('emits a native click from the projected button', () => {
    getButton().click();

    expect(fixture.componentInstance.clickCount()).toBe(1);
  });

  it('prevents interaction when disabled', () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const button = getButton();
    button.click();

    expect(button.disabled).toBeTrue();
    expect(fixture.componentInstance.clickCount()).toBe(0);
  });

  it('exposes loading state and prevents repeated interaction', () => {
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();

    const button = getButton();

    expect(button.disabled).toBeTrue();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(getHost().querySelector('[role="status"]')?.textContent).toContain(
      'Saving',
    );
    expect(button.querySelector('.bulud-button__spinner')).not.toBeNull();

    button.click();
    expect(fixture.componentInstance.clickCount()).toBe(0);
  });

  it('applies the requested visual variant and size', () => {
    fixture.componentInstance.variant.set('danger');
    fixture.componentInstance.size.set('large');
    fixture.detectChanges();

    expect(getButton().classList).toContain('bulud-button--danger');
    expect(getButton().classList).toContain('bulud-button--large');
  });

  it('supports full-width layout on the host', () => {
    fixture.componentInstance.fullWidth.set(true);
    fixture.detectChanges();

    expect(getHost().classList).toContain('bulud-button-host--full-width');
  });
});
