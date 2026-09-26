import { DOCUMENT } from '@angular/common';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuludTextareaAutosize } from './bulud-textarea-autosize';

class MockResizeObserver {
  static readonly instances: MockResizeObserver[] = [];
  private readonly callback: ResizeObserverCallback;
  disconnectCount = 0;
  private readonly observedElements: Element[] = [];

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observedElements.push(element);
  }

  disconnect(): void {
    this.disconnectCount += 1;
  }

  triggerWidth(width: number): void {
    this.callback(
      [
        {
          target: this.observedElements[0]!,
          contentRect: { width, height: 0 },
        } as unknown as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }

  triggerMetrics(): void {
    const target = this.observedElements.at(-1);
    if (!target) {
      return;
    }

    this.callback(
      [
        {
          target,
          contentRect: { width: 0, height: 0 },
        } as unknown as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }

  triggerTextareaMetrics(): void {
    const target = this.observedElements[0];
    if (!target) {
      return;
    }

    this.callback(
      [
        {
          target,
          contentRect: { width: 0, height: 0 },
        } as unknown as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }
}

class MockFontLoadingSet {
  private readonly listeners = new Set<EventListener>();

  addEventListener(type: 'loadingdone', listener: EventListener): void {
    if (type === 'loadingdone') {
      this.listeners.add(listener);
    }
  }

  removeEventListener(type: 'loadingdone', listener: EventListener): void {
    if (type === 'loadingdone') {
      this.listeners.delete(listener);
    }
  }

  triggerLoadingDone(): void {
    for (const listener of this.listeners) {
      listener(new Event('loadingdone'));
    }
  }

  get listenerCount(): number {
    return this.listeners.size;
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

@Component({
  imports: [BuludTextareaAutosize],
  template: `
    <form>
      <textarea
        buludTextareaAutosize
        [enabled]="enabled"
        [value]="value"
      ></textarea>
    </form>
  `,
})
class FormHostComponent {
  enabled = true;
  value = '';
}

@Component({
  imports: [BuludTextareaAutosize],
  template: `
    <form id="form-a"></form>
    <textarea
      buludTextareaAutosize
      [attr.form]="formId"
      [enabled]="enabled"
      [value]="value"
    ></textarea>
    <form id="form-b"></form>
  `,
})
class DynamicFormHostComponent {
  enabled = true;
  formId: string | null = 'form-a';
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

    const cloneNode = textarea.cloneNode.bind(textarea);
    textarea.cloneNode = ((deep?: boolean) => {
      const clone = cloneNode(deep) as HTMLTextAreaElement;
      Object.defineProperty(clone, 'getBoundingClientRect', {
        configurable: true,
        value: () => {
          const styles = getComputedStyle(clone);
          const padding =
            Number.parseFloat(styles.paddingTop) +
            Number.parseFloat(styles.paddingBottom);
          const borders =
            Number.parseFloat(styles.borderTopWidth) +
            Number.parseFloat(styles.borderBottomWidth);
          const content =
            clone.value === 'x'
              ? Number.parseFloat(styles.fontSize) * 1.2
              : contentHeight;
          return {
            width: textarea.getBoundingClientRect().width,
            height: content + padding + borders,
          } as DOMRect;
        },
      });
      Object.defineProperty(clone, 'scrollHeight', {
        configurable: true,
        get: () => {
          const styles = getComputedStyle(clone);
          const content =
            clone.value === 'x'
              ? Number.parseFloat(styles.fontSize) * 1.2
              : contentHeight;
          return (
            content +
            Number.parseFloat(styles.paddingTop) +
            Number.parseFloat(styles.paddingBottom)
          );
        },
      });
      return clone;
    }) as HTMLTextAreaElement['cloneNode'];
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

  it('measures normal line-height and responds to different font sizes', () => {
    contentHeight = 0;
    const smallFixture = createHost((textarea, host) => {
      textarea.style.fontSize = '12px';
      textarea.style.lineHeight = 'normal';
      host.minRows = 2;
      host.maxRows = 3;
    });
    const smallHeight = Number.parseFloat(
      textareaOf(smallFixture).style.height,
    );
    expect(smallHeight).toBeGreaterThan(0);
    expect(textareaOf(smallFixture).style.overflowY).toBe('hidden');
    smallFixture.destroy();

    const largeFixture = createHost((textarea, host) => {
      textarea.style.fontSize = '24px';
      textarea.style.lineHeight = 'normal';
      host.minRows = 2;
      host.maxRows = 3;
    });
    const largeHeight = Number.parseFloat(
      textareaOf(largeFixture).style.height,
    );

    expect(largeHeight).toBeGreaterThan(smallHeight);
    largeFixture.destroy();
  });

  it('uses explicit pixel line-height for row constraints', () => {
    contentHeight = 0;
    const fixture = createHost((textarea, host) => {
      textarea.style.fontSize = '24px';
      textarea.style.lineHeight = '30px';
      host.minRows = 2;
      host.maxRows = 3;
    });

    expect(textareaOf(fixture).style.height).toBe('60px');
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

  it('reasserts externally changed owned sizing without a resize loop', async () => {
    contentHeight = 80;
    const fixture = createHost();
    const textarea = textareaOf(fixture);
    const observer = MockResizeObserver.instances[0];

    expect(textarea.style.height).toBe('80px');
    expect(textarea.style.overflowY).toBe('hidden');

    textarea.style.height = '20px';
    await fixture.whenStable();
    expect(textarea.style.height).toBe('80px');

    textarea.style.overflowY = 'scroll';
    await fixture.whenStable();
    expect(textarea.style.height).toBe('80px');
    expect(textarea.style.overflowY).toBe('hidden');

    textarea.style.height = '10px';
    textarea.style.overflowY = 'scroll';
    observer.triggerTextareaMetrics();
    expect(textarea.style.height).toBe('80px');
    expect(textarea.style.overflowY).toBe('hidden');
    expect(MockResizeObserver.instances).toHaveSize(1);

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('');
    expect(textarea.style.overflowY).toBe('');

    textarea.style.height = '12px';
    textarea.style.overflowY = 'scroll';
    await fixture.whenStable();
    expect(textarea.style.height).toBe('12px');
    expect(textarea.style.overflowY).toBe('scroll');

    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('80px');
    expect(textarea.style.overflowY).toBe('hidden');

    fixture.destroy();
    textarea.style.height = '14px';
    textarea.style.overflowY = 'scroll';
    observer.triggerTextareaMetrics();
    await Promise.resolve();
    expect(textarea.style.height).toBe('14px');
    expect(textarea.style.overflowY).toBe('scroll');
  });

  it('remeasures inherited typography changes without a width or value change', async () => {
    contentHeight = 0;
    const fixture = createHost((textarea, host) => {
      host.minRows = 2;
      host.maxRows = 3;
      const ancestor = textarea.parentElement!;
      ancestor.style.setProperty('--textarea-line-height', '20px');
      textarea.style.lineHeight = 'var(--textarea-line-height)';
    });
    const textarea = textareaOf(fixture);
    const ancestor = textarea.parentElement!;

    expect(textarea.style.height).toBe('40px');
    const width = textarea.getBoundingClientRect().width;
    ancestor.style.setProperty('--textarea-line-height', '30px');
    await fixture.whenStable();

    expect(textarea.value).toBe('');
    expect(textarea.getBoundingClientRect().width).toBe(width);
    expect(textarea.style.height).toBe('60px');
    fixture.destroy();
  });

  it('ignores unrelated document churn while retaining relevant observers', async () => {
    const view = document.defaultView!;
    const originalGetComputedStyle = view.getComputedStyle;
    let computedStyleCalls = 0;
    Object.defineProperty(view, 'getComputedStyle', {
      configurable: true,
      value: (...args: Parameters<typeof getComputedStyle>) => {
        computedStyleCalls += 1;
        return originalGetComputedStyle.apply(view, args);
      },
    });

    try {
      const fixture = createHost((textarea) => {
        textarea.style.lineHeight = '20px';
      });
      const callsAfterInit = computedStyleCalls;
      const unrelated = document.createElement('div');
      unrelated.textContent = 'unrelated mutation';
      document.body.appendChild(unrelated);
      await fixture.whenStable();

      expect(computedStyleCalls).toBe(callsAfterInit);
      unrelated.remove();
      fixture.destroy();
    } finally {
      Object.defineProperty(view, 'getComputedStyle', {
        configurable: true,
        value: originalGetComputedStyle,
      });
    }
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

  it('resizes immediately when row bounds change and normalizes equivalent values', async () => {
    contentHeight = 50;
    const fixture = createHost((textarea, host) => {
      textarea.style.lineHeight = '20px';
      host.minRows = 2;
      host.maxRows = 4;
    });
    const textarea = textareaOf(fixture);

    expect(textarea.style.height).toBe('50px');
    expect(textarea.style.overflowY).toBe('hidden');

    fixture.componentInstance.minRows = 4;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('80px');
    expect(textarea.style.overflowY).toBe('hidden');

    fixture.componentInstance.minRows = 4.9;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('80px');
    expect(textarea.style.overflowY).toBe('hidden');

    fixture.componentInstance.minRows = 1;
    fixture.componentInstance.maxRows = 2;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('40px');
    expect(textarea.style.overflowY).toBe('auto');

    fixture.componentInstance.maxRows = 4;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('50px');
    expect(textarea.style.overflowY).toBe('hidden');

    fixture.componentInstance.minRows = 3;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('60px');
    expect(textarea.style.overflowY).toBe('hidden');

    fixture.componentInstance.minRows = 1;
    fixture.componentInstance.maxRows = 2;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('40px');
    expect(textarea.style.overflowY).toBe('auto');
  });

  it('remeasures empty placeholders and removes stale probe placeholders', async () => {
    contentHeight = 40;
    const fixture = createHost((textarea, host) => {
      textarea.style.lineHeight = '20px';
      textarea.setAttribute('placeholder', 'Short');
      host.value = '';
    });
    const textarea = textareaOf(fixture);

    expect(textarea.style.height).toBe('40px');

    contentHeight = 80;
    textarea.setAttribute('placeholder', 'A much longer localized placeholder');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('80px');

    const probe = document.documentElement
      .querySelector<HTMLDivElement>('div[aria-hidden="true"]')
      ?.shadowRoot?.querySelector('textarea');
    expect(probe?.getAttribute('placeholder')).toBe(
      'A much longer localized placeholder',
    );

    contentHeight = 20;
    textarea.removeAttribute('placeholder');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('20px');
    expect(probe?.hasAttribute('placeholder')).toBeFalse();

    contentHeight = 60;
    textarea.value = 'non-empty';
    textarea.dispatchEvent(new Event('input'));
    textarea.setAttribute('placeholder', 'A different placeholder');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('60px');
  });

  it('resizes after native form reset and reconnects exactly once', async () => {
    contentHeight = 80;
    const fixture = TestBed.createComponent(FormHostComponent);
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    textarea.style.padding = '0';
    textarea.style.border = '0';
    textarea.style.height = '33px';
    fixture.componentInstance.value = 'long current value';
    defineScrollHeight(textarea);
    fixture.detectChanges();

    expect(textarea.style.height).toBe('80px');

    textarea.defaultValue = 'short default value';
    contentHeight = 20;
    form.reset();
    await fixture.whenStable();
    expect(textarea.value).toBe('short default value');
    expect(textarea.style.height).toBe('20px');

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('33px');

    textarea.defaultValue = 'disabled reset';
    contentHeight = 80;
    form.reset();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('33px');

    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('80px');

    textarea.defaultValue = 're-enabled reset';
    contentHeight = 20;
    form.reset();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('20px');

    fixture.destroy();
    textarea.defaultValue = 'after destroy';
    contentHeight = 80;
    form.reset();
    await Promise.resolve();
    expect(textarea.style.height).toBe('33px');
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

  it('respects CSS max-height and combines it with row limits', async () => {
    const cssTightFixture = createHost((textarea) => {
      textarea.style.maxHeight = '50px';
    });
    const cssTightTextarea = textareaOf(cssTightFixture);
    contentHeight = 100;
    cssTightTextarea.value = 'overflowing';
    cssTightTextarea.dispatchEvent(new Event('input'));
    expect(cssTightTextarea.style.height).toBe('50px');
    expect(cssTightTextarea.style.overflowY).toBe('auto');
    cssTightFixture.destroy();

    const fittingFixture = createHost((textarea) => {
      textarea.style.maxHeight = '50px';
    });
    const fittingTextarea = textareaOf(fittingFixture);
    contentHeight = 40;
    fittingTextarea.value = 'fitting';
    fittingTextarea.dispatchEvent(new Event('input'));
    expect(fittingTextarea.style.height).toBe('40px');
    expect(fittingTextarea.style.overflowY).toBe('hidden');
    fittingFixture.destroy();

    const noneFixture = createHost((textarea) => {
      textarea.style.maxHeight = 'none';
    });
    const noneTextarea = textareaOf(noneFixture);
    contentHeight = 100;
    noneTextarea.value = 'unconstrained';
    noneTextarea.dispatchEvent(new Event('input'));
    expect(noneTextarea.style.height).toBe('100px');
    expect(noneTextarea.style.overflowY).toBe('hidden');
    noneFixture.destroy();

    contentHeight = 100;
    const combinedFixture = createHost((textarea, host) => {
      textarea.style.lineHeight = '20px';
      textarea.style.maxHeight = '80px';
      host.maxRows = 5;
    });
    const combinedTextarea = textareaOf(combinedFixture);
    combinedTextarea.value = 'combined';
    combinedTextarea.dispatchEvent(new Event('input'));
    expect(combinedTextarea.style.height).toBe('80px');
    expect(combinedTextarea.style.overflowY).toBe('auto');

    combinedTextarea.style.maxHeight = '120px';
    await combinedFixture.whenStable();
    expect(combinedTextarea.style.height).toBe('100px');
    expect(combinedTextarea.style.overflowY).toBe('hidden');

    combinedTextarea.style.maxHeight = '40px';
    await combinedFixture.whenStable();
    expect(combinedTextarea.style.height).toBe('40px');
    expect(combinedTextarea.style.overflowY).toBe('auto');
    combinedFixture.destroy();
  });

  it('applies CSS max-height in content-box and border-box modes', () => {
    const contentBoxFixture = createHost((textarea) => {
      textarea.style.boxSizing = 'content-box';
      textarea.style.paddingBlock = '6px';
      textarea.style.borderBlock = '2px solid';
      textarea.style.maxHeight = '80px';
    });
    const contentBoxTextarea = textareaOf(contentBoxFixture);
    contentHeight = 100;
    contentBoxTextarea.value = 'content-box';
    contentBoxTextarea.dispatchEvent(new Event('input'));
    expect(contentBoxTextarea.style.height).toBe('80px');
    expect(contentBoxTextarea.style.overflowY).toBe('auto');
    contentBoxFixture.destroy();

    const borderBoxFixture = createHost((textarea) => {
      textarea.style.boxSizing = 'border-box';
      textarea.style.paddingBlock = '6px';
      textarea.style.borderBlock = '2px solid';
      textarea.style.maxHeight = '80px';
    });
    const borderBoxTextarea = textareaOf(borderBoxFixture);
    contentHeight = 100;
    borderBoxTextarea.value = 'border-box';
    borderBoxTextarea.dispatchEvent(new Event('input'));
    expect(borderBoxTextarea.style.height).toBe('80px');
    expect(borderBoxTextarea.style.overflowY).toBe('auto');
    borderBoxFixture.destroy();
  });

  it('rebinds reset handling across dynamic form associations', async () => {
    contentHeight = 80;
    const fixture = TestBed.createComponent(DynamicFormHostComponent);
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    const formA = fixture.nativeElement.querySelector(
      '#form-a',
    ) as HTMLFormElement;
    const formB = fixture.nativeElement.querySelector(
      '#form-b',
    ) as HTMLFormElement;
    textarea.style.padding = '0';
    textarea.style.border = '0';
    fixture.componentInstance.value = 'long current';
    defineScrollHeight(textarea);
    fixture.detectChanges();

    textarea.defaultValue = 'short A';
    contentHeight = 20;
    formA.reset();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('20px');

    fixture.componentInstance.formId = null;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    formA.appendChild(textarea);
    await fixture.whenStable();
    expect(textarea.form).toBe(formA);
    formB.appendChild(textarea);
    await fixture.whenStable();
    expect(textarea.form).toBe(formB);

    contentHeight = 80;
    textarea.value = 'long B';
    textarea.dispatchEvent(new Event('input'));
    fixture.componentInstance.formId = 'form-b';
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.form).toBe(formB);

    textarea.defaultValue = 'short B';
    formA.reset();
    await fixture.whenStable();
    expect(textarea.value).toBe('long B');
    expect(textarea.style.height).toBe('80px');

    contentHeight = 20;
    formB.reset();
    await fixture.whenStable();
    expect(textarea.value).toBe('short B');
    expect(textarea.style.height).toBe('20px');

    formA.appendChild(textarea);
    formB.remove();
    await fixture.whenStable();
    expect(textarea.form).toBeNull();

    const replacement = document.createElement('form');
    replacement.id = 'form-b';
    document.body.appendChild(replacement);
    await fixture.whenStable();
    expect(textarea.form).toBe(replacement);

    contentHeight = 80;
    textarea.value = 'long without form';
    textarea.dispatchEvent(new Event('input'));
    fixture.nativeElement.appendChild(textarea);
    fixture.componentInstance.formId = null;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.form).toBeNull();
    textarea.defaultValue = 'short without form';
    formB.reset();
    await fixture.whenStable();
    expect(textarea.value).toBe('long without form');
    expect(textarea.style.height).toBe('80px');

    fixture.componentInstance.formId = 'form-b';
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.form).toBe(replacement);

    contentHeight = 20;
    textarea.defaultValue = 'replacement default';
    replacement.reset();
    await fixture.whenStable();
    expect(textarea.value).toBe('replacement default');
    expect(textarea.style.height).toBe('20px');

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    fixture.destroy();
    replacement.reset();
    await Promise.resolve();
    expect(textarea.style.height).toBe('');
    replacement.remove();
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

  it('remeasures immediately when box-sizing changes in either direction', async () => {
    const fixture = createHost((textarea) => {
      textarea.style.boxSizing = 'content-box';
      textarea.style.paddingBlock = '6px';
      textarea.style.borderBlock = '2px solid';
      textarea.style.lineHeight = '20px';
    });
    const textarea = textareaOf(fixture);

    expect(textarea.style.height).toBe('40px');
    expect(textarea.style.overflowY).toBe('hidden');

    textarea.style.boxSizing = 'border-box';
    await fixture.whenStable();
    expect(textarea.style.height).toBe('56px');
    expect(textarea.style.overflowY).toBe('hidden');

    textarea.style.boxSizing = 'content-box';
    await fixture.whenStable();
    expect(textarea.style.height).toBe('40px');
    expect(textarea.style.overflowY).toBe('hidden');
  });

  it('remeasures after asynchronous font loading completes and cleans up the listener', () => {
    const injectedDocument = TestBed.inject(DOCUMENT);
    const descriptor = Object.getOwnPropertyDescriptor(
      injectedDocument,
      'fonts',
    );
    const fontLoadingSet = new MockFontLoadingSet();
    Object.defineProperty(injectedDocument, 'fonts', {
      configurable: true,
      value: fontLoadingSet,
    });

    try {
      contentHeight = 40;
      const fixture = createHost((textarea, host) => {
        textarea.style.lineHeight = '20px';
        host.minRows = 2;
        host.maxRows = 3;
      });
      const textarea = textareaOf(fixture);

      expect(fontLoadingSet.listenerCount).toBe(1);
      expect(textarea.style.height).toBe('40px');

      contentHeight = 80;
      fontLoadingSet.triggerLoadingDone();

      expect(textarea.style.height).toBe('60px');
      expect(textarea.style.overflowY).toBe('auto');

      fixture.destroy();
      expect(fontLoadingSet.listenerCount).toBe(0);
    } finally {
      if (descriptor) {
        Object.defineProperty(injectedDocument, 'fonts', descriptor);
      } else {
        delete (injectedDocument as unknown as { fonts?: FontFaceSet }).fonts;
      }
    }
  });

  it('handles horizontal scrollbar gutters for wrap-off and preserves soft wrapping', async () => {
    const cases = [
      { overflowX: 'scroll', overflowing: false, expectedHeight: '55px' },
      { overflowX: 'scroll', overflowing: true, expectedHeight: '55px' },
      { overflowX: 'auto', overflowing: false, expectedHeight: '40px' },
      { overflowX: 'auto', overflowing: true, expectedHeight: '55px' },
      { overflowX: 'hidden', overflowing: true, expectedHeight: '40px' },
    ] as const;

    for (const testCase of cases) {
      const fixture = createHost((textarea) => {
        textarea.setAttribute('wrap', 'off');
        textarea.style.lineHeight = '20px';
        textarea.style.overflowX = testCase.overflowX;
        Object.defineProperty(textarea, 'scrollWidth', {
          configurable: true,
          get: () => (testCase.overflowing ? 200 : 100),
        });
        Object.defineProperty(textarea, 'clientWidth', {
          configurable: true,
          get: () => 100,
        });
        Object.defineProperty(textarea, 'offsetHeight', {
          configurable: true,
          get: () =>
            testCase.overflowX === 'scroll' || testCase.overflowing ? 55 : 40,
        });
        Object.defineProperty(textarea, 'clientHeight', {
          configurable: true,
          get: () => 40,
        });
      });
      const textarea = textareaOf(fixture);

      expect(textarea.style.height).toBe(testCase.expectedHeight);
      fixture.destroy();
    }

    const fixture = createHost((textarea) => {
      textarea.setAttribute('wrap', 'off');
      textarea.style.lineHeight = '20px';
      Object.defineProperty(textarea, 'scrollWidth', {
        configurable: true,
        get: () => 200,
      });
      Object.defineProperty(textarea, 'clientWidth', {
        configurable: true,
        get: () => 100,
      });
    });
    const textarea = textareaOf(fixture);
    textarea.setAttribute('wrap', 'soft');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('40px');
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

  it('remeasures after text metrics change while value and width stay unchanged', () => {
    const fixture = createHost((textarea, host) => {
      textarea.style.lineHeight = '20px';
      host.minRows = 2;
      host.maxRows = 3;
    });
    const textarea = textareaOf(fixture);
    const observer = MockResizeObserver.instances[0];

    expect(textarea.style.height).toBe('40px');
    textarea.style.lineHeight = '30px';
    observer.triggerMetrics();

    expect(textarea.value).toBe('');
    expect(textarea.style.height).toBe('60px');
    expect(textarea.style.overflowY).toBe('hidden');
  });

  it('remeasures border-box row constraints after vertical box metrics change', () => {
    const fixture = createHost((textarea, host) => {
      textarea.style.boxSizing = 'border-box';
      textarea.style.lineHeight = '20px';
      host.minRows = 2;
      host.maxRows = 3;
    });
    const textarea = textareaOf(fixture);
    const observer = MockResizeObserver.instances[0];

    expect(textarea.style.height).toBe('40px');
    textarea.style.paddingTop = '5px';
    textarea.style.paddingBottom = '7px';
    textarea.style.borderTopStyle = 'solid';
    textarea.style.borderBottomStyle = 'solid';
    textarea.style.borderTopWidth = '2px';
    textarea.style.borderBottomWidth = '3px';
    observer.triggerMetrics();

    expect(textarea.value).toBe('');
    expect(textarea.style.height).toBe('57px');
    expect(textarea.style.overflowY).toBe('hidden');
  });

  it('keeps only-child and last-child selectors intact and removes the probe', () => {
    const fixture = TestBed.createComponent(HostComponent);
    const bodyChildrenBefore = [...document.body.children];
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.matches(':only-child')).toBeTrue();
    expect(textarea.matches(':last-child')).toBeTrue();
    defineScrollHeight(textarea);
    fixture.detectChanges();

    expect(textarea.matches(':only-child')).toBeTrue();
    expect(textarea.matches(':last-child')).toBeTrue();
    expect([...document.body.children]).toEqual(bodyChildrenBefore);
    expect(
      document.documentElement.querySelectorAll('div[aria-hidden="true"]'),
    ).toHaveSize(1);

    fixture.destroy();

    expect(
      document.documentElement.querySelectorAll('div[aria-hidden="true"]'),
    ).toHaveSize(0);
    expect([...document.body.children]).toEqual(bodyChildrenBefore);
  });

  it('preserves fractional row geometry at the maxRows boundary', () => {
    contentHeight = 95.9;
    const fixture = createHost((textarea, host) => {
      textarea.style.lineHeight = '19.2px';
      host.minRows = 1;
      host.maxRows = 5;
    });
    const textarea = textareaOf(fixture);
    const observer = MockResizeObserver.instances[0];

    expect(textarea.style.height).toBe('95.9px');
    expect(textarea.style.overflowY).toBe('hidden');

    contentHeight = 96.1;
    textarea.value = 'one more fraction';
    observer.triggerMetrics();

    expect(textarea.style.height).toBe('96px');
    expect(textarea.style.overflowY).toBe('auto');
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
