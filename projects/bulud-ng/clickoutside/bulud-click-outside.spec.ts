import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BuludClickOutside,
  BuludClickOutsideEvent,
  BuludClickOutsideTrigger,
} from './bulud-click-outside';

@Component({
  imports: [BuludClickOutside],
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- Mutable consumer fixture retained by the official Angular 22 migration.
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      buludClickOutside
      [enabled]="enabled()"
      [triggers]="triggers()"
      (outside)="events.push($event)"
    >
      <button type="button">Inside</button>
    </div>
    <button type="button">Outside</button>
  `,
})
class HostComponent {
  readonly enabled = signal(true);
  readonly triggers = signal<readonly BuludClickOutsideTrigger[]>([
    'pointerdown',
    'focusin',
  ]);
  readonly events: BuludClickOutsideEvent[] = [];
}

describe('BuludClickOutside', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  function createHost(): ComponentFixture<HostComponent> {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('emits for pointer and focus interaction outside the host', () => {
    const fixture = createHost();
    const outside = fixture.nativeElement.querySelectorAll('button')[1];

    outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    expect(fixture.componentInstance.events).toEqual([
      { trigger: 'focusin' },
      { trigger: 'pointerdown' },
    ]);
  });

  it('does not emit twice for a pointer interaction followed by focus', () => {
    const fixture = createHost();
    const outside = fixture.nativeElement.querySelectorAll('button')[1];

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(fixture.componentInstance.events).toEqual([
      { trigger: 'pointerdown' },
    ]);
  });

  it('ignores interaction inside the host and duplicate configured triggers', () => {
    const fixture = createHost();
    const inside = fixture.nativeElement.querySelector('button');
    fixture.componentInstance.triggers.set(['pointerdown', 'pointerdown']);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    inside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.events).toEqual([]);
  });

  it('supports disabling and re-enabling listeners', async () => {
    const fixture = createHost();
    const outside = fixture.nativeElement.querySelectorAll('button')[1];

    fixture.componentInstance.enabled.set(false);
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.events).toEqual([]);

    fixture.componentInstance.enabled.set(true);
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.events).toEqual([
      { trigger: 'pointerdown' },
    ]);
  });

  it('removes listeners when destroyed', () => {
    const fixture = createHost();
    const outside = fixture.nativeElement.querySelectorAll('button')[1];
    fixture.destroy();

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.events).toEqual([]);
  });
});
