import { DOCUMENT } from '@angular/common';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuludTextareaAutosize } from './bulud-textarea-autosize';

class MockResizeObserver {
  static readonly instances: MockResizeObserver[] = [];
  private readonly callback: ResizeObserverCallback;
  disconnectCount = 0;
  private observedElement: Element | null = null;

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

  triggerWidth(width: number): void {
    this.callback(
      [
        {
          target: this.observedElement!,
          contentRect: { width, height: 0 },
        } as unknown as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }
}

@Component({
  imports: [BuludTextareaAutosize],
  template: `
    <textarea
      buludTextareaAutosize
      [enabled]="enabled"
      [minRows]="minRows"
      [maxRows]="maxRows"
      [value]="value"
    ></textarea>
  `,
})
class HostComponent {
  enabled = true;
  minRows: number | null = null;
  maxRows: number | null = null;
  value = '';
}

describe('BuludTextareaAutosize', () => {
  const originalResizeObserver = globalThis.ResizeObserver;
  let contentHeight = 40;

  beforeEach(() => {
    contentHeight = 40;
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

  function createHost(
    setup: (textarea: HTMLTextAreaElement, host: HostComponent) => void = () =>
      undefined,
  ): ComponentFixture<HostComponent> {
    const fixture = TestBed.createComponent(HostComponent);
    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.style.padding = '0';
    textarea.style.border = '0';
    setup(textarea, fixture.componentInstance);
    defineScrollHeight(textarea);
    fixture.detectChanges();
    return fixture;
  }

  function textareaOf(
    fixture: ComponentFixture<HostComponent>,
  ): HTMLTextAreaElement {
    return fixture.nativeElement.querySelector('textarea');
  }

  function defineScrollHeight(textarea: HTMLTextAreaElement): void {
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get: () => {
        const styles = getComputedStyle(textarea);
        return (
          contentHeight +
          Number.parseFloat(styles.paddingTop) +
          Number.parseFloat(styles.paddingBottom)
        );
      },
    });
  }

  it('sets the initial content-box height', () => {
    const fixture = createHost((textarea) => {
      textarea.style.boxSizing = 'content-box';
      textarea.style.paddingBlock = '4px';
      textarea.style.borderBlock = '2px solid';
      textarea.style.lineHeight = '20px';
    });

    expect(textareaOf(fixture).style.height).toBe('40px');
    expect(textareaOf(fixture).style.overflowY).toBe('hidden');
  });

  it('grows and shrinks after input', () => {
    const fixture = createHost();
    const textarea = textareaOf(fixture);

    contentHeight = 80;
    textarea.value = 'two lines';
    textarea.dispatchEvent(new Event('input'));
    expect(textarea.style.height).toBe('80px');

    contentHeight = 20;
    textarea.value = 'one line';
    textarea.dispatchEvent(new Event('input'));
    expect(textarea.style.height).toBe('20px');
  });

  it('resizes after an Angular-bound programmatic value change', async () => {
    const fixture = createHost();
    const textarea = textareaOf(fixture);

    contentHeight = 100;
    fixture.componentInstance.value = 'programmatic value';
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();

    expect(textarea.style.height).toBe('100px');
  });

  it('does not produce a different result for an unchanged input', () => {
    const fixture = createHost();
    const textarea = textareaOf(fixture);
    const height = textarea.style.height;

    textarea.dispatchEvent(new Event('input'));

    expect(textarea.style.height).toBe(height);
  });

  it('respects minRows and maxRows and scrolls at the maximum', () => {
    const fixture = createHost((textarea, host) => {
      textarea.style.lineHeight = '20px';
      host.minRows = 3;
      host.maxRows = 4;
    });
    const textarea = textareaOf(fixture);

    expect(textarea.style.height).toBe('60px');
    expect(textarea.style.overflowY).toBe('hidden');

    contentHeight = 120;
    textarea.value = 'many lines';
    textarea.dispatchEvent(new Event('input'));
    expect(textarea.style.height).toBe('80px');
    expect(textarea.style.overflowY).toBe('auto');

    contentHeight = 20;
    textarea.value = 'short';
    textarea.dispatchEvent(new Event('input'));
    expect(textarea.style.height).toBe('60px');
    expect(textarea.style.overflowY).toBe('hidden');
  });

  it('clears stale scrolling before measuring content that shrinks below maxRows', () => {
    const fixture = createHost((textarea, host) => {
      textarea.style.lineHeight = '20px';
      host.maxRows = 2;
    });
    const textarea = textareaOf(fixture);
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get: () => contentHeight + (textarea.style.overflowY === 'auto' ? 30 : 0),
    });

    contentHeight = 100;
    textarea.value = 'many lines';
    textarea.dispatchEvent(new Event('input'));
    expect(textarea.style.height).toBe('40px');
    expect(textarea.style.overflowY).toBe('auto');

    contentHeight = 20;
    textarea.value = 'short';
    textarea.dispatchEvent(new Event('input'));

    expect(textarea.style.height).toBe('20px');
    expect(textarea.style.overflowY).toBe('hidden');
    expect(MockResizeObserver.instances).toHaveSize(1);
  });

  it('rejects row limits below one and normalizes valid fractional values', () => {
    const invalidValues = [
      0,
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      0.5,
    ];

    for (const value of invalidValues) {
      const fixture = createHost((textarea, host) => {
        textarea.style.lineHeight = '20px';
        host.minRows = value;
        host.maxRows = value;
      });

      expect(textareaOf(fixture).style.height).toBe('40px');
      expect(textareaOf(fixture).style.overflowY).toBe('hidden');
      fixture.destroy();
    }

    const fractionalFixture = createHost((textarea, host) => {
      textarea.style.lineHeight = '20px';
      host.minRows = 1.5;
      host.maxRows = 1.5;
    });
    expect(textareaOf(fractionalFixture).style.height).toBe('20px');
    expect(textareaOf(fractionalFixture).style.overflowY).toBe('auto');
    fractionalFixture.destroy();

    contentHeight = 80;
    const integerFixture = createHost((textarea, host) => {
      textarea.style.lineHeight = '20px';
      host.minRows = 2;
      host.maxRows = 3;
    });
    expect(textareaOf(integerFixture).style.height).toBe('60px');
    expect(textareaOf(integerFixture).style.overflowY).toBe('auto');
    integerFixture.destroy();

    contentHeight = 40;
    const interactionFixture = createHost((textarea, host) => {
      textarea.style.lineHeight = '20px';
      host.minRows = 3.5;
      host.maxRows = 2.5;
    });
    expect(textareaOf(interactionFixture).style.height).toBe('60px');
    expect(textareaOf(interactionFixture).style.overflowY).toBe('hidden');
  });

  it('accounts for padding and borders in border-box mode', () => {
    const fixture = createHost((textarea) => {
      textarea.style.boxSizing = 'border-box';
      textarea.style.paddingTop = '6px';
      textarea.style.paddingBottom = '6px';
      textarea.style.borderTop = '2px solid';
      textarea.style.borderBottom = '2px solid';
      textarea.style.lineHeight = '20px';
    });

    expect(textareaOf(fixture).style.height).toBe('56px');
  });

  it('remeasures after a width change without observing its own height loop', () => {
    const fixture = createHost();
    const textarea = textareaOf(fixture);
    const observer = MockResizeObserver.instances[0];

    contentHeight = 70;
    observer.triggerWidth(240);

    expect(textarea.style.height).toBe('70px');
    expect(MockResizeObserver.instances).toHaveSize(1);
  });

  it('does not mutate while disabled and remeasures immediately when enabled', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.enabled = false;
    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.style.padding = '0';
    textarea.style.border = '0';
    defineScrollHeight(textarea);
    textarea.style.height = '33px';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('33px');
    expect(MockResizeObserver.instances).toHaveSize(0);

    contentHeight = 90;
    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('90px');
    expect(MockResizeObserver.instances).toHaveSize(1);
  });

  it('disconnects listeners and restores styles on destroy', () => {
    const fixture = createHost((textarea) => {
      textarea.style.height = '33px';
      textarea.style.overflowY = 'scroll';
    });
    const textarea = textareaOf(fixture);
    const observer = MockResizeObserver.instances[0];
    fixture.destroy();

    expect(observer.disconnectCount).toBe(1);
    expect(textarea.style.height).toBe('33px');
    expect(textarea.style.overflowY).toBe('scroll');

    contentHeight = 100;
    textarea.value = 'after destroy';
    textarea.dispatchEvent(new Event('input'));
    expect(textarea.style.height).toBe('33px');
  });

  it('does not throw when ResizeObserver is unavailable', () => {
    globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;

    expect(() => createHost()).not.toThrow();
  });

  it('does not measure when computed-style support is unavailable', () => {
    const view = document.defaultView!;
    const originalGetComputedStyle = view.getComputedStyle;
    Object.defineProperty(view, 'getComputedStyle', {
      configurable: true,
      value: undefined,
    });

    try {
      const fixture = createHost();
      expect(textareaOf(fixture).style.height).toBe('');
    } finally {
      Object.defineProperty(view, 'getComputedStyle', {
        configurable: true,
        value: originalGetComputedStyle,
      });
    }
  });

  it('is safe when the injected document has no defaultView', () => {
    const injectedDocument = TestBed.inject(DOCUMENT);
    const descriptor = Object.getOwnPropertyDescriptor(
      injectedDocument,
      'defaultView',
    );
    Object.defineProperty(injectedDocument, 'defaultView', {
      configurable: true,
      value: null,
    });

    try {
      expect(() => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
      }).not.toThrow();
    } finally {
      if (descriptor) {
        Object.defineProperty(injectedDocument, 'defaultView', descriptor);
      } else {
        delete (injectedDocument as unknown as { defaultView?: Window })
          .defaultView;
      }
    }
  });
});
