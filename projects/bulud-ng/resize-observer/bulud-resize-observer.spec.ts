import { DOCUMENT } from '@angular/common';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuludElementSize, BuludResizeObserver } from './bulud-resize-observer';

interface MockContentBoxSize {
  readonly inlineSize: number;
  readonly blockSize: number;
}

interface MockEntryOptions {
  readonly target?: Element;
  readonly contentBoxSize?: MockContentBoxSize | readonly MockContentBoxSize[];
  readonly contentRect?: { readonly width: number; readonly height: number };
}

class MockResizeObserver {
  static readonly instances: MockResizeObserver[] = [];
  private readonly callback: ResizeObserverCallback;
  observedElement: Element | null = null;
  disconnectCount = 0;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observedElement = element;
  }

  disconnect(): void {
    this.disconnectCount += 1;
  }

  trigger(
    width: number,
    height: number,
    contentBoxSize: MockContentBoxSize | readonly MockContentBoxSize[] = {
      inlineSize: width,
      blockSize: height,
    },
  ): void {
    this.triggerEntries([{ contentBoxSize, contentRect: { width, height } }]);
  }

  triggerEntries(entries: readonly MockEntryOptions[]): void {
    const mockEntries = entries.map((entry) =>
      createMockEntry(entry, this.observedElement),
    ) as ResizeObserverEntry[];
    this.callback(mockEntries, this as unknown as ResizeObserver);
  }
}

function createMockEntry(
  options: MockEntryOptions,
  observedElement: Element | null,
): ResizeObserverEntry {
  return {
    target: options.target ?? observedElement!,
    contentRect: options.contentRect ?? { width: 0, height: 0 },
    contentBoxSize: options.contentBoxSize ?? [],
    borderBoxSize: [],
    devicePixelContentBoxSize: [],
  } as unknown as ResizeObserverEntry;
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

  function observer(): MockResizeObserver {
    return MockResizeObserver.instances.at(-1)!;
  }

  it('emits the initial content-box width and height', () => {
    const fixture = createHost();

    observer().trigger(320, 180);

    expect(fixture.componentInstance.sizes).toEqual([
      { width: 320, height: 180 },
    ]);
  });

  it('emits width-only, height-only, and combined changes', () => {
    const fixture = createHost();
    observer().trigger(100, 50);
    observer().trigger(120, 50);
    observer().trigger(120, 70);
    observer().trigger(140, 80);

    expect(fixture.componentInstance.sizes).toEqual([
      { width: 100, height: 50 },
      { width: 120, height: 50 },
      { width: 120, height: 70 },
      { width: 140, height: 80 },
    ]);
  });

  it('suppresses identical consecutive dimensions, including zero', () => {
    const fixture = createHost();
    observer().trigger(0, 0);
    observer().trigger(0, 0);
    observer().trigger(1, 0);
    observer().trigger(1, 0);

    expect(fixture.componentInstance.sizes).toEqual([
      { width: 0, height: 0 },
      { width: 1, height: 0 },
    ]);
  });

  it('uses content-box sizes in array and single-object browser shapes', () => {
    const fixture = createHost();
    const current = observer();

    current.trigger(300, 200, [{ inlineSize: 120, blockSize: 80 }]);
    current.trigger(400, 300, {
      inlineSize: 140,
      blockSize: 90,
    });

    expect(fixture.componentInstance.sizes).toEqual([
      { width: 120, height: 80 },
      { width: 140, height: 90 },
    ]);
  });

  it('falls back to contentRect when contentBoxSize is unavailable', () => {
    const fixture = createHost();

    observer().triggerEntries([{ contentRect: { width: 210, height: 110 } }]);

    expect(fixture.componentInstance.sizes).toEqual([
      { width: 210, height: 110 },
    ]);
  });

  it('ignores entries for other elements and suppresses duplicate callbacks', () => {
    const fixture = createHost();
    const other = document.createElement('div');
    const current = observer();

    current.triggerEntries([
      { target: other, contentRect: { width: 900, height: 900 } },
      { contentRect: { width: 100, height: 50 } },
      { contentRect: { width: 100, height: 50 } },
    ]);

    expect(fixture.componentInstance.sizes).toEqual([
      { width: 100, height: 50 },
    ]);
  });

  it('does not observe when initially disabled or when enabled is unchanged', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.enabled = false;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(MockResizeObserver.instances).toHaveSize(0);

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(MockResizeObserver.instances).toHaveSize(0);
  });

  it('disconnects and reconnects exactly one observer across enable cycles', async () => {
    const fixture = createHost();
    const first = observer();

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(first.disconnectCount).toBe(1);

    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(MockResizeObserver.instances).toHaveSize(2);
    expect(
      MockResizeObserver.instances.filter((item) => item.disconnectCount === 0),
    ).toHaveSize(1);

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(MockResizeObserver.instances).toHaveSize(3);
    expect(
      MockResizeObserver.instances.filter((item) => item.disconnectCount === 0),
    ).toHaveSize(1);
  });

  it('reports a size changed while disabled after re-enable', async () => {
    const fixture = createHost();
    const first = observer();
    first.trigger(100, 50);

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    first.trigger(200, 80);
    expect(fixture.componentInstance.sizes).toEqual([
      { width: 100, height: 50 },
    ]);

    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    observer().trigger(200, 80);
    expect(fixture.componentInstance.sizes).toEqual([
      { width: 100, height: 50 },
      { width: 200, height: 80 },
    ]);
  });

  it('disconnects on destroy and ignores callbacks after destroy', () => {
    const fixture = createHost();
    const current = observer();
    fixture.destroy();

    current.trigger(100, 50);

    expect(current.disconnectCount).toBe(1);
    expect(fixture.componentInstance.sizes).toEqual([]);
  });

  it('is safe when ResizeObserver or the browser window is unavailable', () => {
    globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;
    expect(() => createHost()).not.toThrow();
    expect(MockResizeObserver.instances).toHaveSize(0);

    const document = TestBed.inject(DOCUMENT);
    const descriptor = Object.getOwnPropertyDescriptor(document, 'defaultView');
    Object.defineProperty(document, 'defaultView', {
      configurable: true,
      value: null,
    });
    try {
      expect(() => createHost()).not.toThrow();
      expect(MockResizeObserver.instances).toHaveSize(0);
    } finally {
      if (descriptor) {
        Object.defineProperty(document, 'defaultView', descriptor);
      } else {
        delete (document as unknown as { defaultView?: unknown }).defaultView;
      }
    }
  });
});
