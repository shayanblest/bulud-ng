import { DOCUMENT } from '@angular/common';
import {
  Component,
  provideZonelessChangeDetection,
  ViewEncapsulation,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { BuludTextareaAutosize } from './bulud-textarea-autosize';

class MockResizeObserver {
  static readonly instances: MockResizeObserver[] = [];
  private readonly callback: ResizeObserverCallback;
  disconnectCount = 0;
  private readonly observedElements = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observedElements.add(element);
  }

  unobserve(element: Element): void {
    this.observedElements.delete(element);
  }

  disconnect(): void {
    this.disconnectCount += 1;
    this.observedElements.clear();
  }

  triggerWidth(width: number): void {
    this.callback(
      [
        {
          target: [...this.observedElements][0]!,
          contentRect: { width, height: 0 },
        } as unknown as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }

  triggerMetrics(): void {
    const target = [...this.observedElements].at(-1);
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

  triggerTarget(target: Element): void {
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

  isObserving(target: Element): boolean {
    return this.observedElements.has(target);
  }

  triggerTextareaMetrics(): void {
    const target = [...this.observedElements][0];
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
    <div class="textarea-host">
      <textarea
        buludTextareaAutosize
        [enabled]="enabled"
        [minRows]="minRows"
        [maxRows]="maxRows"
        [value]="value"
      ></textarea>
    </div>
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

@Component({
  imports: [BuludTextareaAutosize],
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <form id="form-a">
      <textarea
        buludTextareaAutosize
        [attr.form]="formId"
        [enabled]="enabled"
        [value]="value"
      ></textarea>
    </form>
    <form id="form-b"></form>
  `,
})
class ShadowRootFormHostComponent {
  enabled = true;
  formId: string | null = 'form-a';
  value = 'long current';
}

@Component({
  selector: 'app-root',
  imports: [BuludTextareaAutosize],
  template: `
    <textarea
      buludTextareaAutosize
      [minRows]="minRows"
      [maxRows]="maxRows"
    ></textarea>
  `,
})
class ApplicationRootHostComponent {
  minRows = 2;
  maxRows = 3;
}

@Component({
  imports: [BuludTextareaAutosize],
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <style>
      textarea {
        line-height: 20px;
      }
      :host([data-theme='dark']) textarea {
        line-height: 30px;
      }
      :host([dir='rtl']) textarea {
        line-height: 25px;
      }
      :host([data-density='compact']) textarea {
        line-height: 35px;
      }
    </style>
    <textarea
      buludTextareaAutosize
      [minRows]="minRows"
      [maxRows]="maxRows"
    ></textarea>
  `,
})
class ShadowRootHostComponent {
  minRows = 2;
  maxRows = 3;
}

@Component({
  imports: [BuludTextareaAutosize],
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <style>
      textarea {
        line-height: inherit;
      }
    </style>
    <textarea buludTextareaAutosize [minRows]="minRows"></textarea>
  `,
})
class ReparentedShadowHostComponent {
  minRows = 2;
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

  it('preserves collapsed and ranged selections during normal line-height measurement', () => {
    contentHeight = 20;
    const fixture = createHost((textarea) => {
      textarea.style.lineHeight = 'normal';
    });
    const textarea = textareaOf(fixture);
    textarea.focus();
    textarea.value = '0123456789abcdefghij';
    textarea.setSelectionRange(8, 8, 'none');
    textarea.dispatchEvent(new Event('input'));
    expect(textarea.value).toBe('0123456789abcdefghij');
    expect(textarea.selectionStart).toBe(8);
    expect(textarea.selectionEnd).toBe(8);

    textarea.setSelectionRange(4, 14, 'backward');
    textarea.dispatchEvent(new Event('input'));
    expect(textarea.value).toBe('0123456789abcdefghij');
    expect(textarea.selectionStart).toBe(4);
    expect(textarea.selectionEnd).toBe(14);
    expect(textarea.selectionDirection).toBe('backward');

    for (const position of [3, 11, 17]) {
      textarea.setSelectionRange(position, position, 'none');
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.selectionStart).toBe(position);
      expect(textarea.selectionEnd).toBe(position);
    }
    fixture.destroy();
  });

  it('defers normal-line-height measurement throughout IME composition', async () => {
    contentHeight = 20;
    const fixture = createHost((textarea, host) => {
      host.minRows = 2;
      textarea.style.lineHeight = 'normal';
      textarea.setAttribute('placeholder', 'Compose here');
    });
    const textarea = textareaOf(fixture);
    const directive = fixture.debugElement
      .query(By.directive(BuludTextareaAutosize))
      .injector.get(BuludTextareaAutosize);
    const resizeSpy = spyOn(
      directive as unknown as { resize: () => void },
      'resize',
    ).and.callThrough();
    const valueDescriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )!;
    let valueWrites = 0;
    Object.defineProperty(textarea, 'value', {
      configurable: true,
      get: () => valueDescriptor.get!.call(textarea),
      set: (value: string) => {
        valueWrites += 1;
        valueDescriptor.set!.call(textarea, value);
      },
    });

    textarea.focus();
    textarea.value = 'before after';
    textarea.setSelectionRange(7, 7, 'none');
    valueWrites = 0;
    textarea.dispatchEvent(new CompositionEvent('compositionstart'));
    textarea.value = 'before あ after';
    textarea.setSelectionRange(7, 7, 'none');
    const composingInput = new Event('input', { bubbles: true });
    Object.defineProperty(composingInput, 'isComposing', { value: true });
    textarea.dispatchEvent(composingInput);

    expect(valueWrites).toBe(1);
    expect(textarea.value).toBe('before あ after');
    expect(textarea.getAttribute('placeholder')).toBe('Compose here');
    expect(textarea.selectionStart).toBe(7);
    expect(textarea.selectionEnd).toBe(7);

    valueWrites = 0;
    contentHeight = 80;
    const resizeCallsBeforeCompositionEnd = resizeSpy.calls.count();
    textarea.dispatchEvent(new CompositionEvent('compositionend'));
    await fixture.whenStable();

    expect(valueWrites).toBe(0);
    expect(textarea.value).toBe('before あ after');
    expect(textarea.selectionStart).toBe(7);
    expect(textarea.selectionEnd).toBe(7);
    expect(textarea.style.height).toBe('80px');
    expect(resizeSpy.calls.count() - resizeCallsBeforeCompositionEnd).toBe(1);
    fixture.destroy();
  });

  it('resets composition bookkeeping across disable and re-enable', async () => {
    contentHeight = 20;
    const fixture = createHost((textarea) => {
      textarea.style.lineHeight = '20px';
    });
    const textarea = textareaOf(fixture);

    textarea.dispatchEvent(new CompositionEvent('compositionstart'));
    textarea.value = 'composing value';
    const composingInput = new Event('input', { bubbles: true });
    Object.defineProperty(composingInput, 'isComposing', { value: true });
    textarea.dispatchEvent(composingInput);

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    contentHeight = 80;
    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('80px');

    for (const nextHeight of [90, 100]) {
      textarea.dispatchEvent(new CompositionEvent('compositionstart'));
      textarea.value = `composition cycle ${nextHeight}`;
      const cycleInput = new Event('input', { bubbles: true });
      Object.defineProperty(cycleInput, 'isComposing', { value: true });
      textarea.dispatchEvent(cycleInput);

      fixture.componentInstance.enabled = false;
      fixture.changeDetectorRef.markForCheck();
      await fixture.whenStable();
      contentHeight = nextHeight;
      fixture.componentInstance.enabled = true;
      fixture.changeDetectorRef.markForCheck();
      await fixture.whenStable();
      expect(textarea.style.height).toBe(`${nextHeight}px`);
    }

    contentHeight = 110;
    textarea.value = 'completed next input';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    expect(textarea.style.height).toBe('110px');

    fixture.destroy();
  });

  it('cleans composition bookkeeping when destroyed before compositionend', () => {
    const fixture = createHost((textarea) => {
      textarea.style.lineHeight = '20px';
    });
    const textarea = textareaOf(fixture);
    textarea.dispatchEvent(new CompositionEvent('compositionstart'));
    textarea.value = 'active composition';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    expect(() => {
      fixture.destroy();
      textarea.dispatchEvent(new CompositionEvent('compositionend'));
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }).not.toThrow();
  });

  it('measures one row for a long wrapping normal-line-height placeholder', async () => {
    const fixture = createHost((textarea, host) => {
      host.minRows = 2;
      host.maxRows = 5;
      textarea.style.width = '140px';
      textarea.style.lineHeight = 'normal';
      textarea.setAttribute('placeholder', 'long placeholder '.repeat(40));
    });
    const textarea = textareaOf(fixture);
    delete (textarea as unknown as { scrollHeight?: number }).scrollHeight;
    await fixture.whenStable();
    const longPlaceholderHeight = textarea.getBoundingClientRect().height;
    expect(longPlaceholderHeight).toBeGreaterThan(0);
    expect(longPlaceholderHeight).toBeLessThan(180);

    textarea.setAttribute('placeholder', 'short');
    await fixture.whenStable();
    const shortPlaceholderHeight = textarea.getBoundingClientRect().height;
    expect(shortPlaceholderHeight).toBeLessThan(longPlaceholderHeight);

    textarea.removeAttribute('placeholder');
    await fixture.whenStable();
    expect(textarea.getBoundingClientRect().height).toBeLessThanOrEqual(
      shortPlaceholderHeight,
    );
    fixture.destroy();
  });

  it('restores every placeholder state after normal-line-height measurement', async () => {
    const fixture = createHost((textarea, host) => {
      host.minRows = 2;
      host.maxRows = 3;
      textarea.style.width = '140px';
      textarea.style.lineHeight = 'normal';
      textarea.setAttribute('placeholder', 'Initial placeholder');
    });
    const textarea = textareaOf(fixture);
    delete (textarea as unknown as { scrollHeight?: number }).scrollHeight;
    await fixture.whenStable();

    expect(textarea.hasAttribute('placeholder')).toBeTrue();
    expect(textarea.getAttribute('placeholder')).toBe('Initial placeholder');
    expect(textarea.getBoundingClientRect().height).toBeGreaterThan(0);

    const longPlaceholder = 'Long wrapping placeholder '.repeat(40);
    textarea.setAttribute('placeholder', longPlaceholder);
    await fixture.whenStable();
    expect(textarea.getAttribute('placeholder')).toBe(longPlaceholder);

    textarea.setAttribute('placeholder', '');
    await fixture.whenStable();
    expect(textarea.hasAttribute('placeholder')).toBeTrue();
    expect(textarea.getAttribute('placeholder')).toBe('');

    textarea.removeAttribute('placeholder');
    await fixture.whenStable();
    expect(textarea.hasAttribute('placeholder')).toBeFalse();
    expect(textarea.getAttribute('placeholder')).toBeNull();

    textarea.setAttribute('placeholder', 'Repeated placeholder');
    for (let cycle = 0; cycle < 3; cycle += 1) {
      textarea.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      expect(textarea.getAttribute('placeholder')).toBe('Repeated placeholder');
    }

    fixture.destroy();
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
    observer.triggerMetrics();
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
    observer.triggerMetrics();
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

  it('remeasures ancestor dir and data-theme attribute metric changes', async () => {
    const style = document.createElement('style');
    style.textContent = `
      .textarea-attribute-metrics textarea { line-height: 20px; }
      .textarea-attribute-metrics[dir='rtl'] textarea { line-height: 25px; }
      .textarea-attribute-metrics[data-theme='dark'] textarea { line-height: 30px; }
    `;
    document.head.appendChild(style);
    try {
      contentHeight = 0;
      const fixture = createHost((textarea, host) => {
        host.minRows = 2;
        host.maxRows = 3;
        textarea.parentElement!.classList.add('textarea-attribute-metrics');
      });
      const textarea = textareaOf(fixture);
      const ancestor = textarea.parentElement!;

      expect(textarea.style.height).toBe('40px');
      ancestor.setAttribute('dir', 'rtl');
      await fixture.whenStable();
      expect(textarea.style.height).toBe('50px');

      ancestor.setAttribute('data-theme', 'dark');
      await fixture.whenStable();
      expect(textarea.style.height).toBe('60px');
      fixture.destroy();
    } finally {
      style.remove();
    }
  });

  it('remeasures when focus-within on a metric ancestor changes line-height', async () => {
    const style = document.createElement('style');
    style.textContent = `
      .focus-within-metrics textarea { line-height: 20px; }
      .focus-within-metrics:focus-within textarea { line-height: 30px; }
    `;
    document.head.appendChild(style);
    try {
      contentHeight = 0;
      const fixture = createHost((textarea, host) => {
        host.minRows = 2;
        textarea.parentElement!.classList.add('focus-within-metrics');
        const button = document.createElement('button');
        button.type = 'button';
        textarea.parentElement!.append(button);
      });
      const textarea = textareaOf(fixture);
      const ancestor = textarea.parentElement!;
      const button = ancestor.querySelector('button')!;

      expect(textarea.style.height).toBe('40px');
      const width = textarea.getBoundingClientRect().width;
      button.focus();
      await fixture.whenStable();

      expect(textarea.value).toBe('');
      expect(textarea.getBoundingClientRect().width).toBe(width);
      expect(textarea.style.height).toBe('60px');
      fixture.destroy();
    } finally {
      style.remove();
    }
  });

  it('remeasures pointer pseudo-state changes only when metrics change', async () => {
    const style = document.createElement('style');
    style.textContent = `
      .pointer-metrics textarea { line-height: 20px; }
      .pointer-metrics:hover textarea { line-height: 30px; }
    `;
    document.head.appendChild(style);
    try {
      contentHeight = 0;
      const fixture = createHost((textarea, host) => {
        host.minRows = 2;
        textarea.parentElement!.classList.add('pointer-metrics');
      });
      const textarea = textareaOf(fixture);
      const ancestor = textarea.parentElement!;
      expect(textarea.style.height).toBe('40px');

      ancestor.dispatchEvent(new Event('pointerover', { bubbles: true }));
      await fixture.whenStable();
      expect(textarea.style.height).toBe('40px');

      ancestor.dispatchEvent(new Event('pointerout', { bubbles: true }));
      await fixture.whenStable();
      expect(textarea.style.height).toBe('40px');
      fixture.destroy();
    } finally {
      style.remove();
    }
  });

  it('coalesces one pointer transition across all metric ancestors', async () => {
    const fixture = createHost();
    const textarea = textareaOf(fixture);
    const directive = fixture.debugElement
      .query(By.directive(BuludTextareaAutosize))
      .injector.get(BuludTextareaAutosize);
    const remeasureSpy = spyOn(
      directive as unknown as { remeasureIfNeeded: () => void },
      'remeasureIfNeeded',
    ).and.callThrough();
    const resizeSpy = spyOn(
      directive as unknown as { resize: () => void },
      'resize',
    ).and.callThrough();
    const ancestor = textarea.parentElement!;

    ancestor.dispatchEvent(new Event('pointerover', { bubbles: true }));
    await Promise.resolve();
    expect(remeasureSpy).toHaveBeenCalledTimes(1);

    ancestor.dispatchEvent(new Event('pointerout', { bubbles: true }));
    await Promise.resolve();
    expect(remeasureSpy).toHaveBeenCalledTimes(2);
    expect(resizeSpy).not.toHaveBeenCalled();

    ancestor.dispatchEvent(new Event('pointerover', { bubbles: true }));
    await Promise.resolve();
    expect(remeasureSpy).toHaveBeenCalledTimes(3);
    expect(resizeSpy).not.toHaveBeenCalled();

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    ancestor.dispatchEvent(new Event('pointerover', { bubbles: true }));
    await Promise.resolve();
    expect(remeasureSpy).toHaveBeenCalledTimes(3);
    fixture.destroy();
  });

  it('remeasures arbitrary ancestor attributes but ignores unrelated metrics', async () => {
    const style = document.createElement('style');
    style.textContent = `
      .textarea-density-metrics textarea { line-height: 20px; }
      .textarea-density-metrics[data-density='compact'] textarea { line-height: 30px; }
    `;
    document.head.appendChild(style);
    try {
      contentHeight = 0;
      const fixture = createHost((textarea, host) => {
        host.minRows = 2;
        textarea.parentElement!.classList.add('textarea-density-metrics');
      });
      const textarea = textareaOf(fixture);
      const ancestor = textarea.parentElement!;
      expect(textarea.style.height).toBe('40px');

      ancestor.setAttribute('data-density', 'compact');
      await fixture.whenStable();
      expect(textarea.style.height).toBe('60px');

      const heightBeforeUnrelatedAttribute = textarea.style.height;
      ancestor.setAttribute('data-unrelated', 'true');
      await fixture.whenStable();
      expect(textarea.style.height).toBe(heightBeforeUnrelatedAttribute);
      fixture.destroy();
    } finally {
      style.remove();
    }
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

  it('remeasures empty placeholders without a DOM measurement node', async () => {
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

    contentHeight = 20;
    textarea.removeAttribute('placeholder');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('20px');
    expect(document.querySelector('div[aria-hidden="true"]')).toBeNull();

    contentHeight = 60;
    textarea.value = 'non-empty';
    textarea.dispatchEvent(new Event('input'));
    textarea.setAttribute('placeholder', 'A different placeholder');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('60px');
    fixture.destroy();
  });

  it('uses effective placeholder typography for the live measurement surface', () => {
    const style = document.createElement('style');
    style.textContent = `
      textarea::placeholder {
        font-size: 24px;
        line-height: 32px;
        letter-spacing: 2px;
      }
    `;
    const fixture = createHost((textarea) => {
      textarea.style.boxSizing = 'border-box';
      textarea.style.width = '220px';
      textarea.style.padding = '4px 8px';
      textarea.style.border = '1px solid';
      textarea.setAttribute('placeholder', 'A long placeholder');
      textarea.value = '';
    });

    try {
      const textarea = textareaOf(fixture);
      textarea.ownerDocument.head.appendChild(style);
      expect(textarea.style.height).not.toBe('');

      textarea.value = 'real value';
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.value).toBe('real value');
    } finally {
      fixture.destroy();
      style.remove();
    }
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

  it('respects max-block-size together with max-height and box sizing', () => {
    contentHeight = 120;
    const contentBoxFixture = createHost((textarea) => {
      textarea.style.lineHeight = '20px';
      textarea.style.paddingBlock = '6px';
      textarea.style.borderBlock = '2px solid';
      textarea.style.boxSizing = 'content-box';
      textarea.style.maxHeight = '80px';
      textarea.style.maxBlockSize = '50px';
    });
    const contentBoxTextarea = textareaOf(contentBoxFixture);
    expect(contentBoxTextarea.style.height).toBe('50px');
    expect(contentBoxTextarea.style.overflowY).toBe('auto');
    contentBoxFixture.destroy();

    const borderBoxFixture = createHost((textarea) => {
      textarea.style.lineHeight = '20px';
      textarea.style.paddingBlock = '6px';
      textarea.style.borderBlock = '2px solid';
      textarea.style.boxSizing = 'border-box';
      textarea.style.maxHeight = '80px';
      textarea.style.maxBlockSize = '50px';
    });
    const borderBoxTextarea = textareaOf(borderBoxFixture);
    expect(borderBoxTextarea.style.height).toBe('50px');
    expect(borderBoxTextarea.style.overflowY).toBe('auto');
    borderBoxFixture.destroy();

    contentHeight = 40;
    const fittingFixture = createHost((textarea) => {
      textarea.style.maxBlockSize = '50px';
    });
    expect(textareaOf(fittingFixture).style.overflowY).toBe('hidden');
    fittingFixture.destroy();
  });

  it('measures against the textarea width constraints without a probe', () => {
    contentHeight = 80;
    const fixture = createHost((textarea) => {
      textarea.style.width = '220px';
      textarea.style.minWidth = '300px';
      textarea.style.maxWidth = '100%';
      textarea.style.minInlineSize = '300px';
      textarea.style.maxInlineSize = '100%';
      textarea.style.lineHeight = '20px';
    });
    const textarea = textareaOf(fixture);
    expect(textarea.style.height).toBe('80px');
    expect(textarea.clientWidth).toBeGreaterThan(0);
    fixture.destroy();
  });

  it('observes selector-driving textarea attributes but ignores unrelated ones', async () => {
    const style = document.createElement('style');
    style.textContent = `
      textarea { line-height: 20px !important; }
      textarea[disabled] { line-height: 30px !important; }
      textarea[aria-invalid='true'] { line-height: 25px !important; }
    `;
    document.head.appendChild(style);
    try {
      contentHeight = 0;
      const fixture = createHost((textarea, host) => {
        textarea.style.width = '220px';
        host.minRows = 1;
        host.maxRows = 3;
      });
      const textarea = textareaOf(fixture);

      expect(textarea.style.height).toBe('20px');
      textarea.setAttribute('disabled', '');
      await fixture.whenStable();
      expect(textarea.style.height).toBe('30px');

      textarea.setAttribute('aria-invalid', 'true');
      await fixture.whenStable();
      expect(textarea.style.height).toBe('25px');

      textarea.setAttribute('data-unrelated', 'true');
      await fixture.whenStable();
      expect(textarea.style.height).toBe('25px');
      fixture.destroy();
    } finally {
      style.remove();
    }
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

  it('subtracts the horizontal gutter from content-box CSS max-height', () => {
    for (const boxSizing of ['content-box', 'border-box'] as const) {
      contentHeight = 70;
      const fixture = createHost((textarea) => {
        textarea.setAttribute('wrap', 'off');
        textarea.style.boxSizing = boxSizing;
        if (boxSizing === 'border-box') {
          textarea.style.paddingBlock = '6px';
          textarea.style.borderBlock = '2px solid';
        }
        textarea.style.maxHeight = '80px';
        textarea.style.overflowX = 'scroll';
        Object.defineProperty(textarea, 'scrollWidth', {
          configurable: true,
          get: () => 200,
        });
        Object.defineProperty(textarea, 'clientWidth', {
          configurable: true,
          get: () => 100,
        });
        Object.defineProperty(textarea, 'offsetHeight', {
          configurable: true,
          get: () => (boxSizing === 'border-box' ? 59 : 55),
        });
        Object.defineProperty(textarea, 'clientHeight', {
          configurable: true,
          get: () => 40,
        });
      });
      const textarea = textareaOf(fixture);

      expect(textarea.style.height).toBe('80px');
      expect(textarea.style.overflowY).toBe('auto');

      contentHeight = 40;
      textarea.value = 'fitting';
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.style.height).toBe(
        boxSizing === 'border-box' ? '71px' : '55px',
      );
      expect(textarea.style.overflowY).toBe('hidden');
      fixture.destroy();
    }
  });

  it('measures inside a body-level application root without changing its structure', async () => {
    contentHeight = 20;
    const fixture = TestBed.createComponent(ApplicationRootHostComponent);
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    textarea.style.width = '220px';
    textarea.style.lineHeight = 'normal';
    defineScrollHeight(textarea);
    fixture.detectChanges();
    await fixture.whenStable();

    const rootChildren = [...fixture.nativeElement.children];
    expect(textarea.matches(':only-child')).toBeTrue();
    expect(textarea.matches(':first-child')).toBeTrue();
    expect(textarea.matches(':last-child')).toBeTrue();
    expect(textarea.matches(':nth-child(1)')).toBeTrue();
    expect(document.querySelector('div[aria-hidden="true"]')).toBeNull();
    const minRowsHeight = textarea.getBoundingClientRect().height;
    expect(minRowsHeight).toBeGreaterThan(0);

    fixture.componentInstance.minRows = 3;
    fixture.componentInstance.maxRows = 3;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.getBoundingClientRect().height).toBeGreaterThan(
      minRowsHeight,
    );

    fixture.componentInstance.minRows = 1;
    fixture.componentInstance.maxRows = 2;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.overflowY).toBe('hidden');
    expect([...fixture.nativeElement.children]).toEqual(rootChildren);
    fixture.destroy();
  });

  it('measures normal line-height row limits inside a ShadowRoot', async () => {
    contentHeight = 20;
    const fixture = TestBed.createComponent(ShadowRootHostComponent);
    const textarea = fixture.nativeElement.shadowRoot.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    textarea.style.width = '220px';
    textarea.style.lineHeight = 'normal';
    defineScrollHeight(textarea);
    fixture.detectChanges();
    await fixture.whenStable();

    const minRowsHeight = textarea.getBoundingClientRect().height;

    fixture.componentInstance.minRows = 3;
    fixture.componentInstance.maxRows = 3;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.getBoundingClientRect().height).toBeGreaterThan(
      minRowsHeight,
    );

    fixture.componentInstance.minRows = 1;
    fixture.componentInstance.maxRows = 1;
    contentHeight = 10;
    textarea.dispatchEvent(new Event('input'));
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.overflowY).toBe('hidden');
    fixture.destroy();
  });

  it('observes metric attributes on a ShadowRoot host', async () => {
    contentHeight = 0;
    const fixture = TestBed.createComponent(ShadowRootHostComponent);
    const host = fixture.nativeElement as HTMLElement;
    const textarea = host.shadowRoot!.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    defineScrollHeight(textarea);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(textarea.style.height).toBe('40px');
    host.setAttribute('dir', 'rtl');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('50px');

    host.removeAttribute('dir');
    host.setAttribute('data-theme', 'dark');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('60px');

    host.setAttribute('data-density', 'compact');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('70px');
    fixture.destroy();
  });

  it('reconnects metric observers when a ShadowRoot host is reparented', async () => {
    contentHeight = 0;
    const fixture = TestBed.createComponent(ReparentedShadowHostComponent);
    const host = fixture.nativeElement as HTMLElement;
    const textarea = host.shadowRoot!.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    defineScrollHeight(textarea);
    const containerA = document.createElement('div');
    const containerB = document.createElement('div');
    containerA.style.lineHeight = '20px';
    containerB.style.lineHeight = '30px';
    document.body.append(containerA, containerB);
    containerA.append(host);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(textarea.style.height).toBe('40px');
    containerB.append(host);
    await fixture.whenStable();
    expect(textarea.style.height).toBe('60px');

    containerA.style.lineHeight = '40px';
    await fixture.whenStable();
    expect(textarea.style.height).toBe('60px');

    fixture.destroy();
    containerA.remove();
    containerB.remove();
  });

  it('measures a textarea directly under body without adding a sibling', async () => {
    contentHeight = 20;
    const fixture = createHost((textarea, host) => {
      host.minRows = 2;
      host.maxRows = 3;
      textarea.style.width = '220px';
      textarea.style.lineHeight = 'normal';
    });
    const textarea = textareaOf(fixture);
    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    textarea.parentElement!.removeChild(textarea);
    document.body.appendChild(textarea);
    expect(textarea.parentElement).toBe(document.body);
    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();

    expect(textarea.getBoundingClientRect().height).toBeGreaterThan(0);
    fixture.destroy();
    textarea.remove();
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

  it('rebinds reset handling across form associations inside a ShadowRoot', async () => {
    contentHeight = 80;
    const fixture = TestBed.createComponent(ShadowRootFormHostComponent);
    const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
    const textarea = shadowRoot.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    const formA = shadowRoot.querySelector('#form-a') as HTMLFormElement;
    const formB = shadowRoot.querySelector('#form-b') as HTMLFormElement;
    textarea.style.padding = '0';
    textarea.style.border = '0';
    defineScrollHeight(textarea);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(textarea.form).toBe(formA);

    contentHeight = 80;
    textarea.value = 'long B';
    textarea.dispatchEvent(new Event('input'));
    fixture.componentInstance.formId = 'form-b';
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.form).toBe(formB);

    contentHeight = 20;
    textarea.value = 'untracked value';
    formA.reset();
    await fixture.whenStable();
    expect(textarea.value).toBe('untracked value');
    expect(textarea.style.height).toBe('80px');

    textarea.defaultValue = 'short B';
    textarea.value = 'short B';
    formB.dispatchEvent(new Event('reset'));
    await fixture.whenStable();
    expect(textarea.value).toBe('short B');
    expect(textarea.style.height).toBe('20px');

    fixture.componentInstance.formId = null;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    textarea.value = 'without form';
    formB.reset();
    await fixture.whenStable();
    expect(textarea.value).toBe('without form');

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    fixture.destroy();
    formB.reset();
    await Promise.resolve();
    expect(textarea.value).toBe('without form');
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

  it('remeasures percentage max-height after containing-block height changes', async () => {
    contentHeight = 120;
    const fixture = createHost((textarea) => {
      textarea.parentElement!.style.height = '120px';
      textarea.style.width = '220px';
      textarea.style.maxHeight = '50%';
      textarea.style.lineHeight = '20px';
      Object.defineProperty(textarea, 'offsetHeight', {
        configurable: true,
        get: () =>
          Number.parseFloat(textarea.parentElement?.style.height ?? '0') / 2,
      });
    });
    const textarea = textareaOf(fixture);
    const observer = MockResizeObserver.instances[0];
    await fixture.whenStable();
    const initialHeight = textarea.getBoundingClientRect().height;

    expect(textarea.style.overflowY).toBe('auto');
    textarea.parentElement!.style.height = '240px';
    observer.triggerTextareaMetrics();
    expect(textarea.getBoundingClientRect().height).toBeGreaterThan(
      initialHeight,
    );

    textarea.parentElement!.style.height = '80px';
    contentHeight = 10;
    observer.triggerTextareaMetrics();
    expect(textarea.getBoundingClientRect().height).toBeLessThan(initialHeight);
    expect(textarea.style.overflowY).toBe('hidden');
    fixture.destroy();
  });

  it('uses browser CSS semantics for padded in-flow and positioned percentage bases', async () => {
    contentHeight = 200;
    const fixture = createHost((textarea) => {
      textarea.style.maxHeight = '50%';
      textarea.style.lineHeight = '20px';
      textarea.parentElement!.style.height = '120px';
      textarea.parentElement!.style.paddingBlock = '20px';
      textarea.parentElement!.style.borderBlock = '2px solid';
      Object.defineProperty(textarea, 'offsetHeight', {
        configurable: true,
        get: () => Number.parseFloat(textarea.style.height || '0'),
      });
    });
    const textarea = textareaOf(fixture);
    await fixture.whenStable();
    expect(textarea.style.height).toBe('60px');

    textarea.parentElement!.style.boxSizing = 'border-box';
    await fixture.whenStable();
    expect(textarea.style.height).toBe('38px');

    textarea.style.position = 'absolute';
    textarea.parentElement!.style.position = 'relative';
    await fixture.whenStable();
    expect(textarea.style.height).toBe('58px');
    fixture.destroy();
  });

  it('keeps percentage caps in their declared box while converting to content size', () => {
    contentHeight = 100;
    const contentBoxFixture = createHost((textarea) => {
      textarea.parentElement!.style.height = '120px';
      textarea.style.boxSizing = 'content-box';
      textarea.style.paddingBlock = '10px';
      textarea.style.borderBlock = '2px solid';
      textarea.style.maxHeight = '50%';
    });
    const contentBoxTextarea = textareaOf(contentBoxFixture);
    expect(contentBoxTextarea.style.height).toBe('60px');
    expect(contentBoxTextarea.getBoundingClientRect().height).toBe(84);
    expect(contentBoxTextarea.style.overflowY).toBe('auto');
    contentBoxFixture.destroy();

    const borderBoxFixture = createHost((textarea) => {
      textarea.parentElement!.style.height = '120px';
      textarea.style.boxSizing = 'border-box';
      textarea.style.paddingBlock = '10px';
      textarea.style.borderBlock = '2px solid';
      textarea.style.maxHeight = '50%';
      textarea.style.maxBlockSize = '50%';
    });
    const borderBoxTextarea = textareaOf(borderBoxFixture);
    expect(borderBoxTextarea.style.height).toBe('60px');
    expect(borderBoxTextarea.style.overflowY).toBe('auto');
    borderBoxFixture.destroy();
  });

  it('observes size query containers and reconnects them after reparenting', async () => {
    contentHeight = 0;
    const style = document.createElement('style');
    style.textContent = `
      .textarea-query-shell { container-type: inline-size; }
      .textarea-query-shell textarea { line-height: 20px; }
      .textarea-query-shell.changed textarea { line-height: 30px; }
    `;
    document.head.appendChild(style);
    try {
      const fixture = createHost((textarea, host) => {
        host.minRows = 2;
        textarea.parentElement!.classList.add('textarea-query-shell');
      });
      const textarea = textareaOf(fixture);
      const oldContainer = textarea.parentElement!;
      const observer = MockResizeObserver.instances[0];
      await fixture.whenStable();

      expect(observer.isObserving(oldContainer)).toBeTrue();
      expect(textarea.style.height).toBe('40px');

      oldContainer.classList.add('changed');
      observer.triggerTarget(oldContainer);
      expect(textarea.style.height).toBe('60px');

      const unchangedHeight = textarea.style.height;
      observer.triggerTarget(oldContainer);
      expect(textarea.style.height).toBe(unchangedHeight);

      const newContainer = document.createElement('div');
      newContainer.className = 'textarea-query-shell changed';
      document.body.appendChild(newContainer);
      newContainer.append(textarea);
      await fixture.whenStable();

      expect(observer.isObserving(oldContainer)).toBeFalse();
      expect(observer.isObserving(newContainer)).toBeTrue();
      newContainer.classList.remove('changed');
      observer.triggerTarget(newContainer);
      expect(textarea.style.height).toBe('40px');
      fixture.destroy();
      newContainer.remove();
    } finally {
      style.remove();
    }
  });

  it('observes stretched flex and grid items with layout-definite auto height', async () => {
    contentHeight = 200;
    for (const display of ['flex', 'grid'] as const) {
      const fixture = createHost((textarea) => {
        const item = textarea.parentElement!;
        const layoutParent = document.createElement('div');
        item.replaceWith(layoutParent);
        layoutParent.append(item);
        layoutParent.style.display = display;
        layoutParent.style.height = '120px';
        layoutParent.style.alignItems = 'stretch';
        item.style.minHeight = '0';
        if (display === 'flex') {
          item.style.flex = '1 1 auto';
        }
        textarea.style.maxHeight = '50%';
        textarea.style.lineHeight = '20px';
      });
      const textarea = textareaOf(fixture);
      const item = textarea.parentElement!;
      const layoutParent = item.parentElement!;
      const observer = MockResizeObserver.instances.at(-1)!;
      await fixture.whenStable();

      expect(observer.isObserving(item)).toBeTrue();
      expect(textarea.style.height).toBe('60px');

      layoutParent.style.height = '240px';
      observer.triggerTarget(item);
      expect(textarea.style.height).toBe('120px');

      layoutParent.style.display = 'block';
      layoutParent.style.height = '';
      await fixture.whenStable();
      expect(observer.isObserving(item)).toBeFalse();
      const stableHeight = textarea.style.height;
      textarea.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      expect(textarea.style.height).toBe(stableHeight);

      layoutParent.style.display = display;
      layoutParent.style.height = '120px';
      await fixture.whenStable();
      expect(observer.isObserving(item)).toBeTrue();
      fixture.destroy();
    }
  });

  it('observes stylesheet and CSS-variable definite containing blocks', async () => {
    contentHeight = 200;
    const style = document.createElement('style');
    style.textContent = `
      .textarea-definite-height { height: 240px; }
      .textarea-variable-height { height: var(--textarea-height); }
      .textarea-auto-height { height: auto; }
    `;
    document.head.appendChild(style);
    try {
      const fixture = createHost((textarea) => {
        textarea.style.maxHeight = '50%';
        textarea.style.lineHeight = '20px';
        textarea.parentElement!.classList.add('textarea-definite-height');
      });
      const textarea = textareaOf(fixture);
      const parent = textarea.parentElement!;
      const observer = MockResizeObserver.instances[0];
      await fixture.whenStable();
      expect(observer.isObserving(parent)).toBeTrue();
      expect(textarea.style.height).toBe('120px');

      parent.classList.replace(
        'textarea-definite-height',
        'textarea-variable-height',
      );
      parent.style.setProperty('--textarea-height', '120px');
      await fixture.whenStable();
      expect(textarea.style.height).toBe('60px');

      parent.classList.replace(
        'textarea-variable-height',
        'textarea-auto-height',
      );
      await fixture.whenStable();
      const autoHeight = textarea.style.height;
      textarea.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      expect(textarea.style.height).toBe(autoHeight);
      expect(observer.isObserving(parent)).toBeFalse();

      parent.classList.replace(
        'textarea-auto-height',
        'textarea-definite-height',
      );
      await fixture.whenStable();
      expect(observer.isObserving(parent)).toBeTrue();
      expect(textarea.style.height).toBe('120px');
      fixture.destroy();
    } finally {
      style.remove();
    }
  });

  it('does not manually resolve percentage caps against auto-height parents', async () => {
    contentHeight = 120;
    const fixture = createHost((textarea) => {
      textarea.style.maxHeight = '50%';
      textarea.style.lineHeight = '20px';
      Object.defineProperty(textarea, 'offsetHeight', {
        configurable: true,
        get: () =>
          Number.parseFloat(textarea.parentElement?.style.height ?? '0') / 2,
      });
    });
    const textarea = textareaOf(fixture);
    const parent = textarea.parentElement!;
    const observer = MockResizeObserver.instances[0];

    expect(observer.isObserving(parent)).toBeFalse();
    const firstHeight = textarea.style.height;
    for (let cycle = 0; cycle < 3; cycle += 1) {
      textarea.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      expect(textarea.style.height).toBe(firstHeight);
    }

    parent.style.height = '120px';
    await fixture.whenStable();
    expect(observer.isObserving(parent)).toBeTrue();
    expect(textarea.style.height).toBe('60px');

    parent.style.height = '';
    await fixture.whenStable();
    expect(observer.isObserving(parent)).toBeFalse();
    fixture.destroy();
  });

  it('observes the positioned containing block for absolute percentage max-height', async () => {
    contentHeight = 160;
    const fixture = createHost((textarea) => {
      textarea.style.position = 'absolute';
      textarea.style.maxHeight = '50%';
      textarea.style.lineHeight = '20px';
      const containingBlock = textarea.parentElement!.parentElement!;
      containingBlock.style.position = 'relative';
      containingBlock.style.height = '120px';
      Object.defineProperty(textarea, 'offsetHeight', {
        configurable: true,
        get: () => Number.parseFloat(containingBlock.style.height || '0') / 2,
      });
    });
    const textarea = textareaOf(fixture);
    const observer = MockResizeObserver.instances[0];
    await fixture.whenStable();
    const containingBlock = textarea.parentElement!.parentElement!;
    expect(observer.isObserving(containingBlock)).toBeTrue();
    const initialHeight = Number.parseFloat(textarea.style.height);

    containingBlock.style.height = '240px';
    observer.triggerTarget(containingBlock);
    expect(Number.parseFloat(textarea.style.height)).toBeGreaterThan(
      initialHeight,
    );

    const heightAfterExpansion = textarea.style.height;
    textarea.parentElement!.style.height = '20px';
    observer.triggerTarget(textarea.parentElement!);
    expect(textarea.style.height).toBe(heightAfterExpansion);
    fixture.destroy();
  });

  it('refreshes constraint observation when positioning changes with equal-sized containers', async () => {
    contentHeight = 160;
    const fixture = createHost((textarea) => {
      textarea.style.maxHeight = '50%';
      textarea.style.lineHeight = '20px';
      textarea.parentElement!.style.height = '120px';
      Object.defineProperty(textarea, 'offsetHeight', {
        configurable: true,
        get: () =>
          Number.parseFloat(textarea.parentElement?.style.height ?? '0') / 2,
      });
    });
    const textarea = textareaOf(fixture);
    const oldContainer = textarea.parentElement!;
    const newContainer = document.createElement('div');
    newContainer.style.height = '120px';
    newContainer.style.position = 'relative';
    oldContainer.append(newContainer);
    const observer = MockResizeObserver.instances[0];
    await fixture.whenStable();

    textarea.style.position = 'absolute';
    newContainer.append(textarea);
    await fixture.whenStable();

    expect(observer.isObserving(newContainer)).toBeTrue();
    expect(observer.isObserving(oldContainer)).toBeFalse();
    const initialHeight = textarea.style.height;

    newContainer.style.height = '240px';
    observer.triggerTarget(newContainer);
    expect(textarea.style.height).toBe('120px');

    oldContainer.style.height = '240px';
    observer.triggerTarget(oldContainer);
    expect(textarea.style.height).toBe('120px');
    expect(initialHeight).toBe('60px');
    fixture.destroy();
  });

  it('selects a static filtered containing block and tracks both size directions', async () => {
    contentHeight = 160;
    const fixture = createHost((textarea) => {
      textarea.style.position = 'absolute';
      textarea.style.maxHeight = '50%';
      textarea.style.lineHeight = '20px';
      const containingBlock = textarea.parentElement!.parentElement!;
      const unrelatedOuter = containingBlock.parentElement!;
      containingBlock.style.filter = 'blur(0)';
      containingBlock.style.height = '120px';
      unrelatedOuter.style.height = '800px';
      Object.defineProperty(textarea, 'offsetHeight', {
        configurable: true,
        get: () => Number.parseFloat(containingBlock.style.height || '0') / 2,
      });
    });
    const textarea = textareaOf(fixture);
    const observer = MockResizeObserver.instances[0];
    await fixture.whenStable();
    const containingBlock = textarea.parentElement!.parentElement!;
    const unrelatedOuter = containingBlock.parentElement!;
    expect(observer.isObserving(containingBlock)).toBeTrue();
    expect(observer.isObserving(unrelatedOuter)).toBeFalse();
    const initialHeight = Number.parseFloat(textarea.style.height);

    containingBlock.style.height = '240px';
    observer.triggerTarget(containingBlock);
    const expandedHeight = Number.parseFloat(textarea.style.height);
    expect(expandedHeight).toBeGreaterThan(initialHeight);
    await Promise.resolve();

    containingBlock.style.height = '80px';
    observer.triggerTarget(containingBlock);
    expect(Number.parseFloat(textarea.style.height)).toBeLessThan(
      expandedHeight,
    );
    fixture.destroy();
  });

  it('observes a ShadowRoot host for direct-child relative constraints', async () => {
    contentHeight = 160;
    const fixture = TestBed.createComponent(ReparentedShadowHostComponent);
    const host = fixture.nativeElement as HTMLElement;
    const textarea = host.shadowRoot!.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    textarea.style.maxHeight = '50%';
    textarea.style.lineHeight = '20px';
    textarea.style.padding = '0';
    textarea.style.border = '0';
    host.style.height = '120px';
    Object.defineProperty(textarea, 'offsetHeight', {
      configurable: true,
      get: () => Number.parseFloat(host.style.height || '0') / 2,
    });
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get: () => contentHeight,
    });
    fixture.detectChanges();
    const observer = MockResizeObserver.instances[0];
    expect(observer.isObserving(host)).toBeTrue();
    const initialHeight = textarea.style.height;

    host.style.height = '240px';
    observer.triggerTarget(host);
    expect(textarea.style.height).toBe('120px');

    host.style.height = '80px';
    contentHeight = 10;
    observer.triggerTarget(host);
    expect(textarea.style.height).toBe('40px');
    expect(initialHeight).toBe('60px');
    fixture.destroy();
    expect(observer.isObserving(host)).toBeFalse();
  });

  it('remeasures after moving between same-sized ancestors with different metrics', async () => {
    contentHeight = 0;
    const style = document.createElement('style');
    style.textContent = `
      .textarea-move-a textarea { line-height: 20px; }
      .textarea-move-b textarea { line-height: 30px; }
    `;
    document.head.appendChild(style);
    try {
      const fixture = createHost((textarea, host) => {
        textarea.parentElement!.classList.add('textarea-move-a');
        textarea.style.minHeight = '0';
        host.minRows = 2;
      });
      const textarea = textareaOf(fixture);
      const firstContainer = textarea.parentElement!;
      const secondContainer = document.createElement('div');
      secondContainer.className = 'textarea-move-b';
      secondContainer.style.width = `${firstContainer.offsetWidth}px`;
      document.body.appendChild(secondContainer);

      await fixture.whenStable();
      expect(textarea.style.height).toBe('40px');
      secondContainer.appendChild(textarea);
      await fixture.whenStable();
      expect(textarea.style.height).toBe('60px');

      const unchangedContainer = document.createElement('div');
      unchangedContainer.className = 'textarea-move-b';
      document.body.appendChild(unchangedContainer);
      unchangedContainer.appendChild(textarea);
      await fixture.whenStable();
      expect(textarea.style.height).toBe('60px');

      fixture.destroy();
      secondContainer.remove();
      unchangedContainer.remove();
    } finally {
      style.remove();
    }
  });

  it('remeasures when wrap-off horizontal overflow mode changes', () => {
    const fixture = createHost((textarea) => {
      textarea.setAttribute('wrap', 'off');
      textarea.style.lineHeight = '20px';
      textarea.style.overflowX = 'hidden';
      Object.defineProperty(textarea, 'scrollWidth', {
        configurable: true,
        get: () => 200,
      });
      Object.defineProperty(textarea, 'clientWidth', {
        configurable: true,
        get: () => 100,
      });
      Object.defineProperty(textarea, 'offsetHeight', {
        configurable: true,
        get: () => 55,
      });
      Object.defineProperty(textarea, 'clientHeight', {
        configurable: true,
        get: () => 40,
      });
    });
    const textarea = textareaOf(fixture);
    const observer = MockResizeObserver.instances[0];

    expect(textarea.style.height).toBe('40px');
    textarea.style.overflowX = 'scroll';
    observer.triggerTextareaMetrics();
    expect(textarea.style.height).toBe('55px');

    textarea.style.overflowX = 'hidden';
    observer.triggerTextareaMetrics();
    expect(textarea.style.height).toBe('40px');
    fixture.destroy();
  });

  it('normalizes case-insensitive wrap-off values for scrollbar sizing', async () => {
    for (const wrap of ['off', 'OFF', 'Off', 'oFf'] as const) {
      const fixture = createHost((textarea) => {
        textarea.style.lineHeight = '20px';
        textarea.style.overflowX = 'scroll';
        textarea.setAttribute('wrap', wrap);
        Object.defineProperty(textarea, 'scrollWidth', {
          configurable: true,
          get: () => 200,
        });
        Object.defineProperty(textarea, 'clientWidth', {
          configurable: true,
          get: () => 100,
        });
        Object.defineProperty(textarea, 'offsetHeight', {
          configurable: true,
          get: () => 55,
        });
        Object.defineProperty(textarea, 'clientHeight', {
          configurable: true,
          get: () => 40,
        });
      });
      expect(textareaOf(fixture).style.height).toBe('55px');
      fixture.destroy();
    }

    const fixture = createHost((textarea) => {
      textarea.style.lineHeight = '20px';
      textarea.style.overflowX = 'scroll';
      Object.defineProperty(textarea, 'scrollWidth', {
        configurable: true,
        get: () => 200,
      });
      Object.defineProperty(textarea, 'clientWidth', {
        configurable: true,
        get: () => 100,
      });
      Object.defineProperty(textarea, 'offsetHeight', {
        configurable: true,
        get: () => 55,
      });
      Object.defineProperty(textarea, 'clientHeight', {
        configurable: true,
        get: () => 40,
      });
    });
    const textarea = textareaOf(fixture);
    expect(textarea.style.height).toBe('40px');
    textarea.setAttribute('wrap', 'soft');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('40px');
    textarea.setAttribute('wrap', 'OFF');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('55px');
    textarea.setAttribute('wrap', 'soft');
    await fixture.whenStable();
    expect(textarea.style.height).toBe('40px');
    fixture.destroy();
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

  it('keeps font-size-adjust in the effective signature and invalidates changed metrics', () => {
    contentHeight = 0;
    const fixture = createHost((textarea, host) => {
      host.minRows = 2;
      textarea.style.fontSize = '20px';
      textarea.style.fontSizeAdjust = '0.5';
      textarea.style.lineHeight = 'normal';
    });
    const textarea = textareaOf(fixture);
    const observer = MockResizeObserver.instances[0];
    const directive = fixture.debugElement
      .query(By.directive(BuludTextareaAutosize))
      .injector.get(BuludTextareaAutosize);
    const resizeSpy = spyOn(
      directive as unknown as { resize: () => void },
      'resize',
    ).and.callThrough();

    expect(getComputedStyle(textarea).fontSizeAdjust).toBe(
      getComputedStyle(textarea).fontSizeAdjust,
    );
    textarea.style.fontSizeAdjust = '1.5';
    observer.triggerTextareaMetrics();

    expect(resizeSpy).toHaveBeenCalledTimes(1);
    fixture.destroy();
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

  it('keeps structural selectors and sibling relationships intact', () => {
    const fixture = TestBed.createComponent(HostComponent);
    const bodyChildrenBefore = [...document.body.children];
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.matches(':only-child')).toBeTrue();
    expect(textarea.matches(':first-child')).toBeTrue();
    expect(textarea.matches(':last-child')).toBeTrue();
    expect(textarea.matches(':nth-child(1)')).toBeTrue();
    defineScrollHeight(textarea);
    fixture.detectChanges();

    expect(textarea.matches(':only-child')).toBeTrue();
    expect(textarea.matches(':first-child')).toBeTrue();
    expect(textarea.matches(':last-child')).toBeTrue();
    expect(textarea.matches(':nth-child(1)')).toBeTrue();
    expect([...document.body.children]).toEqual(bodyChildrenBefore);
    expect(textarea.parentElement?.children).toHaveSize(1);
    expect(document.querySelector('div[aria-hidden="true"]')).toBeNull();

    fixture.destroy();

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

  it('restores the latest external styles after repeated enable cycles', async () => {
    const fixture = createHost((textarea) => {
      textarea.style.height = '33px';
      textarea.style.overflowY = 'scroll';
    });
    const textarea = textareaOf(fixture);

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).toBe('33px');
    expect(textarea.style.overflowY).toBe('scroll');

    textarea.style.height = '12px';
    textarea.style.overflowY = 'auto';
    await fixture.whenStable();
    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();

    expect(textarea.style.height).toBe('12px');
    expect(textarea.style.overflowY).toBe('auto');

    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.height).not.toBe('12px');
    fixture.destroy();
    expect(textarea.style.height).toBe('12px');
    expect(textarea.style.overflowY).toBe('auto');
  });

  it('restores inline values and priorities across enable, disable, and destroy', async () => {
    const fixture = createHost((textarea) => {
      textarea.style.setProperty('height', '80px', 'important');
      textarea.style.setProperty('overflow-y', 'scroll', 'important');
    });
    const textarea = textareaOf(fixture);

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(textarea.style.getPropertyValue('height')).toBe('80px');
    expect(textarea.style.getPropertyPriority('height')).toBe('important');
    expect(textarea.style.getPropertyValue('overflow-y')).toBe('scroll');
    expect(textarea.style.getPropertyPriority('overflow-y')).toBe('important');

    textarea.style.setProperty('height', '12px');
    textarea.style.setProperty('overflow-y', 'auto');
    await fixture.whenStable();
    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();

    expect(textarea.style.getPropertyValue('height')).toBe('12px');
    expect(textarea.style.getPropertyPriority('height')).toBe('');
    expect(textarea.style.getPropertyValue('overflow-y')).toBe('auto');
    expect(textarea.style.getPropertyPriority('overflow-y')).toBe('');
    fixture.destroy();

    const absentFixture = createHost();
    const absentTextarea = textareaOf(absentFixture);
    absentFixture.componentInstance.enabled = false;
    absentFixture.changeDetectorRef.markForCheck();
    await absentFixture.whenStable();
    expect(absentTextarea.style.getPropertyValue('height')).toBe('');
    expect(absentTextarea.style.getPropertyPriority('height')).toBe('');
    expect(absentTextarea.style.getPropertyValue('overflow-y')).toBe('');
    expect(absentTextarea.style.getPropertyPriority('overflow-y')).toBe('');
    absentFixture.destroy();
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
    const shadowRootDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'ShadowRoot',
    );
    const descriptor = Object.getOwnPropertyDescriptor(
      injectedDocument,
      'defaultView',
    );
    Object.defineProperty(injectedDocument, 'defaultView', {
      configurable: true,
      value: null,
    });
    Object.defineProperty(globalThis, 'ShadowRoot', {
      configurable: true,
      value: undefined,
    });

    try {
      expect(() => {
        const fixture = TestBed.createComponent(HostComponent);
        const textarea = fixture.nativeElement.querySelector(
          'textarea',
        ) as HTMLTextAreaElement;
        const shadowRootLike = document.createDocumentFragment();
        Object.defineProperty(shadowRootLike, 'host', {
          configurable: true,
          value: textarea.parentElement,
        });
        Object.defineProperty(textarea, 'getRootNode', {
          configurable: true,
          value: () => shadowRootLike,
        });
        fixture.detectChanges();
      }).not.toThrow();
    } finally {
      if (shadowRootDescriptor) {
        Object.defineProperty(globalThis, 'ShadowRoot', shadowRootDescriptor);
      } else {
        delete (globalThis as { ShadowRoot?: unknown }).ShadowRoot;
      }
      if (descriptor) {
        Object.defineProperty(injectedDocument, 'defaultView', descriptor);
      } else {
        delete (injectedDocument as unknown as { defaultView?: Window })
          .defaultView;
      }
    }
  });

  it('remeasures after metric transition completion and coalesces close events', async () => {
    contentHeight = 0;
    const fixture = createHost((textarea, host) => {
      host.minRows = 2;
      textarea.style.lineHeight = '20px';
    });
    const textarea = textareaOf(fixture);
    expect(textarea.style.height).toBe('40px');

    textarea.style.lineHeight = '30px';
    dispatchTransitionEvent(textarea, 'transitionend', 'line-height');
    dispatchTransitionEvent(textarea, 'transitioncancel', 'line-height');
    dispatchAnimationEvent(textarea, 'animationend');
    dispatchAnimationEvent(textarea, 'animationcancel');
    await Promise.resolve();

    expect(textarea.style.height).toBe('60px');
    fixture.destroy();
  });

  it('remeasures font-size transitions and ignores irrelevant transitions', async () => {
    contentHeight = 0;
    const fixture = createHost((textarea, host) => {
      host.minRows = 2;
      textarea.style.fontSize = '12px';
      textarea.style.lineHeight = 'normal';
    });
    const textarea = textareaOf(fixture);
    const directive = fixture.debugElement
      .query(By.directive(BuludTextareaAutosize))
      .injector.get(BuludTextareaAutosize);
    const resizeSpy = spyOn(
      directive as unknown as { resize: () => void },
      'resize',
    ).and.callThrough();
    const initialHeight = textarea.style.height;

    dispatchTransitionEvent(textarea, 'transitionend', 'opacity');
    await Promise.resolve();
    expect(resizeSpy).not.toHaveBeenCalled();

    textarea.style.fontSize = '24px';
    dispatchTransitionEvent(textarea, 'transitionend', 'font-size');
    await Promise.resolve();
    await fixture.whenStable();

    expect(Number.parseFloat(textarea.style.height)).toBeGreaterThan(
      Number.parseFloat(initialHeight),
    );
    fixture.destroy();
  });

  it('remeasures transitions on metric ancestors and cleans completion listeners', async () => {
    contentHeight = 0;
    const fixture = createHost((textarea, host) => {
      host.minRows = 2;
      textarea.parentElement!.style.lineHeight = '20px';
      textarea.style.lineHeight = 'inherit';
    });
    const textarea = textareaOf(fixture);
    const ancestor = textarea.parentElement!;
    expect(textarea.style.height).toBe('40px');

    ancestor.style.lineHeight = '30px';
    dispatchTransitionEvent(ancestor, 'transitionend', 'line-height');
    await Promise.resolve();
    expect(textarea.style.height).toBe('60px');

    fixture.componentInstance.enabled = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    ancestor.style.lineHeight = '40px';
    dispatchTransitionEvent(ancestor, 'transitionend', 'line-height');
    await Promise.resolve();
    expect(textarea.style.height).toBe('');

    fixture.componentInstance.enabled = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    fixture.destroy();
    ancestor.style.lineHeight = '50px';
    expect(() =>
      dispatchTransitionEvent(ancestor, 'transitionend', 'line-height'),
    ).not.toThrow();
  });
});

function dispatchTransitionEvent(
  target: EventTarget,
  type: 'transitionend' | 'transitioncancel',
  propertyName: string,
): void {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'propertyName', { value: propertyName });
  target.dispatchEvent(event);
}

function dispatchAnimationEvent(
  target: EventTarget,
  type: 'animationend' | 'animationcancel',
): void {
  target.dispatchEvent(new Event(type, { bubbles: true }));
}
