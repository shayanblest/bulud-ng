import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { BuludElementSize, BuludResizeObserver } from './bulud-resize-observer';

interface ResizeObserverTestEntry {
  readonly contentRect: { readonly width: number; readonly height: number };
}

class MockResizeObserver {
  static readonly instances: MockResizeObserver[] = [];
  private readonly callback: (
    entries: readonly ResizeObserverTestEntry[],
  ) => void;
  observedElement: Element | null = null;
  disconnectCount = 0;

  constructor(callback: (entries: readonly ResizeObserverTestEntry[]) => void) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observedElement = element;
  }

  disconnect(): void {
    this.disconnectCount += 1;
  }

  trigger(width: number, height: number): void {
    this.callback([{ contentRect: { width, height } }]);
  }
}

@Component({
  imports: [BuludResizeObserver],
  template: `
    <div
      buludResizeObserver
      [enabled]="enabled"
      (sizeChange)="sizes.push($event)"
    ></div>
  `,
})
class HostComponent {
  enabled = true;
  readonly sizes: BuludElementSize[] = [];
}

describe('BuludResizeObserver', () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    MockResizeObserver.instances.length = 0;
    globalThis.ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  function createHost(): ComponentFixture<HostComponent> {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('observes the host and emits content-box dimensions', () => {
    const fixture = createHost();
    const observer = MockResizeObserver.instances[0];

    expect(observer.observedElement).toBe(
      fixture.nativeElement.firstElementChild,
    );
    observer.trigger(320, 180);

    expect(fixture.componentInstance.sizes).toEqual([
      { width: 320, height: 180 },
    ]);
  });

  it('suppresses repeated dimensions, including zero dimensions', () => {
    const fixture = createHost();
    const observer = MockResizeObserver.instances[0];

    observer.trigger(0, 0);
    observer.trigger(0, 0);
    observer.trigger(1, 0);

    expect(fixture.componentInstance.sizes).toEqual([
      { width: 0, height: 0 },
      { width: 1, height: 0 },
    ]);
  });

  it('does not observe while disabled and reconnects when enabled', async () => {
    const fixture = createHost();
    const firstObserver = MockResizeObserver.instances[0];

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(firstObserver.disconnectCount).toBe(1);
    expect(MockResizeObserver.instances).toHaveSize(1);

    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(MockResizeObserver.instances).toHaveSize(2);
    expect(MockResizeObserver.instances[1].observedElement).toBe(
      fixture.nativeElement.firstElementChild,
    );
  });

  it('disconnects on destroy and ignores queued callbacks', () => {
    const fixture = createHost();
    const observer = MockResizeObserver.instances[0];

    fixture.destroy();
    observer.trigger(100, 50);

    expect(observer.disconnectCount).toBe(1);
  });

  it('fails safely when ResizeObserver is unavailable', () => {
    globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;

    expect(() => createHost()).not.toThrow();
    expect(MockResizeObserver.instances).toHaveSize(0);
  });
});
