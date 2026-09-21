import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuludDialog } from './bulud-dialog';

@Component({
  imports: [BuludDialog],
  template: `
    <button #trigger id="trigger" type="button" (click)="open.set(true)">
      Open
    </button>
    <button id="removed-trigger" type="button">Removed trigger</button>
    <bulud-dialog
      [(open)]="open"
      [aria-label]="label()"
      [aria-labelledby]="labelledby()"
      [aria-describedby]="describedby()"
      [closeOnEscape]="escapeEnabled()"
      [closeOnBackdrop]="backdropEnabled()"
      [initialFocus]="initialFocus()"
      [theme]="themeOverride"
      (openChange)="recordOpenChange()"
      (closeRequest)="lastCloseReason.set($event)"
    >
      <h2 id="dialog-title">Dialog title</h2>
      <h2 id="static-initial-focus" tabindex="-1">Static dialog title</h2>
      <p id="dialog-description">Dialog description</p>
      <button id="disconnected-target" tabindex="-1" type="button">
        Removed target
      </button>
      <button id="first-action" type="button">First action</button>
      <button id="second-action" type="button">Second action</button>
    </bulud-dialog>
  `,
})
class TestHost {
  readonly open = signal(false);
  readonly label = signal<string | null>('Accessible dialog');
  readonly labelledby = signal<string | null>(null);
  readonly describedby = signal<string | null>('dialog-description');
  readonly escapeEnabled = signal(true);
  readonly backdropEnabled = signal(true);
  readonly initialFocus = signal<string | undefined>(undefined);
  readonly lastCloseReason = signal<string | null>(null);
  readonly openChangeCount = signal(0);
  readonly themeOverride = {
    background: '#14532d',
    maxWidth: '40rem',
    focusWidth: '5px',
    focusOffset: '7px',
  };

  recordOpenChange(): void {
    this.openChangeCount.update((count) => count + 1);
  }
}

@Component({
  imports: [BuludDialog],
  template: `
    <button id="stack-trigger" type="button">Open stack</button>
    <bulud-dialog [(open)]="thirdOpen" aria-label="Third dialog">
      <button id="stack-third-action" type="button">Third action</button>
    </bulud-dialog>
    @if (secondPresent()) {
      <bulud-dialog [(open)]="secondOpen" aria-label="Second dialog">
        <button id="stack-second-action" type="button">Second action</button>
      </bulud-dialog>
    }
    <bulud-dialog [(open)]="firstOpen" aria-label="First dialog">
      <button id="stack-first-action" type="button">First action</button>
    </bulud-dialog>
  `,
})
class StackHost {
  readonly firstOpen = signal(false);
  readonly secondOpen = signal(false);
  readonly thirdOpen = signal(false);
  readonly secondPresent = signal(true);
}

describe('BuludDialog', () => {
  let fixture: ComponentFixture<TestHost>;

  const getDialog = (): HTMLElement => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    if (!(dialog instanceof HTMLElement)) {
      throw new Error('Expected an open dialog.');
    }
    return dialog;
  };

  const getBackdrop = (): HTMLElement => {
    const backdrop = fixture.nativeElement.querySelector(
      '.bulud-dialog__backdrop',
    );
    if (!(backdrop instanceof HTMLElement)) {
      throw new Error('Expected a dialog backdrop.');
    }
    return backdrop;
  };

  const openFromTrigger = (): HTMLButtonElement => {
    const trigger = fixture.nativeElement.querySelector('#trigger');
    if (!(trigger instanceof HTMLButtonElement)) {
      throw new Error('Expected a trigger.');
    }
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    return trigger;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    document.body.style.overflow = '';
  });

  it('renders no dialog while closed and exposes modal semantics when open', () => {
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    openFromTrigger();
    const dialog = getDialog();

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Accessible dialog');
    expect(dialog.getAttribute('aria-describedby')).toBe('dialog-description');
  });

  it('supports aria-labelledby when aria-label is omitted', () => {
    fixture.componentInstance.label.set(null);
    fixture.componentInstance.labelledby.set('dialog-title');
    openFromTrigger();

    const dialog = getDialog();
    expect(dialog.getAttribute('aria-label')).toBeNull();
    expect(dialog.getAttribute('aria-labelledby')).toBe('dialog-title');
  });

  it('moves focus to an explicit target and restores the trigger', async () => {
    fixture.componentInstance.initialFocus.set('#second-action');
    const trigger = openFromTrigger();

    expect(document.activeElement?.id).toBe('second-action');
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(trigger);
  });

  it('allows a static negative-tabindex heading as explicit initial focus', () => {
    fixture.componentInstance.initialFocus.set('#static-initial-focus');
    openFromTrigger();

    expect(document.activeElement?.id).toBe('static-initial-focus');

    const first = fixture.nativeElement.querySelector(
      '#first-action',
    ) as HTMLButtonElement;
    first.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      }),
    );
    expect(document.activeElement?.id).toBe('second-action');

    const second = fixture.nativeElement.querySelector(
      '#second-action',
    ) as HTMLButtonElement;
    second.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    expect(document.activeElement?.id).toBe('first-action');
  });

  it('recognizes editable content variants and excludes false, hidden, and inert editors', () => {
    openFromTrigger();
    const dialog = getDialog();
    const validEditors = [
      ['bare-editor', undefined],
      ['empty-editor', ''],
      ['true-editor', 'true'],
      ['plaintext-editor', 'plaintext-only'],
    ] as const;

    for (const [id, value] of validEditors) {
      const editor = document.createElement('div');
      editor.id = id;
      editor.setAttribute('contenteditable', value ?? '');
      dialog.append(editor);
    }
    const falseEditor = document.createElement('div');
    falseEditor.id = 'false-editor';
    falseEditor.setAttribute('contenteditable', 'false');
    dialog.append(falseEditor);
    const hiddenEditor = document.createElement('div');
    hiddenEditor.id = 'hidden-editor';
    hiddenEditor.setAttribute('contenteditable', 'true');
    hiddenEditor.hidden = true;
    dialog.append(hiddenEditor);
    const inertEditor = document.createElement('div');
    inertEditor.id = 'inert-editor';
    inertEditor.setAttribute('contenteditable', 'true');
    inertEditor.setAttribute('inert', '');
    dialog.append(inertEditor);

    for (const [id] of validEditors) {
      fixture.componentInstance.initialFocus.set(`#${id}`);
      fixture.detectChanges();
      document.dispatchEvent(new FocusEvent('focusin'));
      expect(document.activeElement?.id).toBe(id);
    }

    for (const id of ['false-editor', 'hidden-editor', 'inert-editor']) {
      fixture.componentInstance.initialFocus.set(`#${id}`);
      fixture.detectChanges();
      document.dispatchEvent(new FocusEvent('focusin'));
      expect(document.activeElement?.id).toBe('first-action');
    }
  });

  it('traps Tab and Shift+Tab when editable content is the only interactive content', () => {
    openFromTrigger();
    const dialog = getDialog();
    dialog.querySelector('#first-action')?.remove();
    dialog.querySelector('#second-action')?.remove();
    const editor = document.createElement('div');
    editor.id = 'only-editor';
    editor.setAttribute('contenteditable', '');
    dialog.append(editor);
    fixture.componentInstance.initialFocus.set(undefined);
    fixture.detectChanges();
    document.dispatchEvent(new FocusEvent('focusin'));

    expect(document.activeElement).toBe(editor);
    editor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    expect(document.activeElement).toBe(editor);
    editor.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      }),
    );
    expect(document.activeElement).toBe(editor);
  });

  it('uses instance focus geometry for the visible focus ring', () => {
    openFromTrigger();
    const dialog = getDialog();
    dialog.focus();

    expect(getComputedStyle(dialog).outlineWidth).toBe('5px');
    expect(getComputedStyle(dialog).outlineOffset).toBe('7px');
  });

  it('rejects plain, disabled, hidden, inert, and disconnected explicit targets', () => {
    openFromTrigger();
    const dialog = getDialog();
    const targets = [
      Object.assign(document.createElement('div'), { id: 'plain-target' }),
      Object.assign(document.createElement('button'), {
        id: 'disabled-target',
        disabled: true,
      }),
      Object.assign(document.createElement('button'), {
        id: 'hidden-target',
        hidden: true,
      }),
      Object.assign(document.createElement('button'), {
        id: 'inert-target',
      }),
    ];
    targets[3].setAttribute('inert', '');
    for (const target of targets) {
      dialog.append(target);
    }

    for (const target of targets) {
      fixture.componentInstance.initialFocus.set(`#${target.id}`);
      fixture.componentInstance.open.set(false);
      fixture.detectChanges();
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
      expect(document.activeElement?.id).toBe('first-action');
    }

    fixture.componentInstance.initialFocus.set('#disconnected-target');
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const disconnected = getDialog().querySelector('#disconnected-target');
    disconnected?.remove();
    (fixture.nativeElement.querySelector('#trigger') as HTMLElement).focus();
    expect(document.activeElement?.id).toBe('first-action');
  });

  it('falls back to the first focusable child and then the dialog surface', () => {
    const trigger = openFromTrigger();
    expect(document.activeElement?.id).toBe('first-action');

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    trigger.remove();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    expect(document.activeElement?.id).toBe('first-action');
  });

  it('does not throw when the opening trigger is removed before close', () => {
    const trigger = openFromTrigger();
    trigger.remove();

    expect(() => {
      fixture.componentInstance.open.set(false);
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('traps Tab and Shift+Tab at the live focusable boundaries', () => {
    openFromTrigger();
    const first = fixture.nativeElement.querySelector(
      '#first-action',
    ) as HTMLButtonElement;
    const second = fixture.nativeElement.querySelector(
      '#second-action',
    ) as HTMLButtonElement;

    second.focus();
    second.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    expect(document.activeElement).toBe(first);

    first.focus();
    first.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      }),
    );
    expect(document.activeElement).toBe(second);
  });

  it('focuses the surface when no focusable content exists', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const dialog = getDialog();
    dialog.querySelector('#first-action')?.remove();
    dialog.querySelector('#second-action')?.remove();
    fixture.detectChanges();
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );

    expect(document.activeElement).toBe(dialog);
    expect(getComputedStyle(dialog).outlineWidth).toBe('5px');
  });

  it('closes once for enabled Escape and emits its user close reason', () => {
    openFromTrigger();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBeFalse();
    expect(fixture.componentInstance.lastCloseReason()).toBe('escape');
  });

  it('does not close when Escape is disabled', () => {
    fixture.componentInstance.escapeEnabled.set(false);
    openFromTrigger();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBeTrue();
    expect(fixture.componentInstance.lastCloseReason()).toBeNull();
  });

  it('closes only for backdrop pointerdown when enabled', () => {
    openFromTrigger();
    getDialog().dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true }),
    );
    expect(fixture.componentInstance.open()).toBeTrue();

    getBackdrop().dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBeFalse();
    expect(fixture.componentInstance.lastCloseReason()).toBe('backdrop');
  });

  it('does not close when a pointer starts inside and ends outside', () => {
    openFromTrigger();
    const dialog = getDialog();
    const backdrop = getBackdrop();
    dialog.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    backdrop.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBeTrue();
  });

  it('does not close for backdrop interaction when disabled', () => {
    fixture.componentInstance.backdropEnabled.set(false);
    openFromTrigger();
    getBackdrop().dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBeTrue();
  });

  it('supports a programmatic close without a user close request', () => {
    openFromTrigger();
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();

    expect(fixture.componentInstance.lastCloseReason()).toBeNull();
  });

  it('does not duplicate openChange or closeRequest emissions', () => {
    openFromTrigger();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.openChangeCount()).toBe(1);
    expect(fixture.componentInstance.lastCloseReason()).toBe('escape');

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.openChangeCount()).toBe(1);
    expect(fixture.componentInstance.lastCloseReason()).toBe('escape');

    openFromTrigger();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.openChangeCount()).toBe(2);
  });

  it('skips disabled and hidden controls while trapping', () => {
    openFromTrigger();
    const first = fixture.nativeElement.querySelector(
      '#first-action',
    ) as HTMLButtonElement;
    const second = fixture.nativeElement.querySelector(
      '#second-action',
    ) as HTMLButtonElement;
    first.disabled = true;
    first.hidden = true;
    second.focus();
    second.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );

    expect(document.activeElement).toBe(second);
  });

  it('skips every negative-tabindex and non-rendered candidate', () => {
    openFromTrigger();
    const dialog = getDialog();
    dialog.querySelector('#first-action')?.remove();
    dialog.querySelector('#second-action')?.remove();

    for (const candidate of [
      { id: 'tabindex-minus-one', attributes: { tabindex: '-1' } },
      { id: 'tabindex-minus-two', attributes: { tabindex: '-2' } },
      { id: 'disabled-candidate', attributes: { disabled: '' } },
      { id: 'hidden-candidate', attributes: { hidden: '' } },
      {
        id: 'display-none-candidate',
        attributes: { style: 'display: none' },
      },
      {
        id: 'visibility-hidden-candidate',
        attributes: { style: 'visibility: hidden' },
      },
      { id: 'inert-candidate', attributes: { inert: '' } },
    ]) {
      const element = document.createElement('button');
      element.id = candidate.id;
      for (const [name, value] of Object.entries(candidate.attributes)) {
        element.setAttribute(name, value);
      }
      dialog.append(element);
    }

    dialog.focus();
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    expect(document.activeElement).toBe(dialog);
  });

  it('uses the live DOM when focusable content changes while open', () => {
    openFromTrigger();
    const dialog = getDialog();
    const first = dialog.querySelector('#first-action') as HTMLButtonElement;
    dialog.querySelector('#second-action')?.remove();
    const dynamic = document.createElement('button');
    dynamic.id = 'dynamic-action';
    dynamic.textContent = 'Dynamic action';
    dialog.append(dynamic);

    dynamic.focus();
    dynamic.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    expect(document.activeElement).toBe(first);

    dynamic.remove();
    first.focus();
    first.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      }),
    );
    expect(document.activeElement).toBe(first);
  });

  it('applies instance theme values while retaining typed defaults and RTL behavior', () => {
    openFromTrigger();
    const backdrop = getBackdrop();
    const dialog = getDialog();
    expect(backdrop.style.getPropertyValue('--bulud-dialog-background')).toBe(
      '#14532d',
    );
    expect(dialog.getAttribute('dir')).toBeNull();
    document.documentElement.dir = 'rtl';
    expect(getDialog()).toBe(dialog);
    document.documentElement.removeAttribute('dir');
  });

  it('cleans listeners and scroll state when destroyed while open', () => {
    openFromTrigger();
    expect(document.body.style.overflow).toBe('hidden');
    fixture.destroy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.body.style.overflow).toBe('');
  });
});

describe('BuludDialog stack ownership', () => {
  let fixture: ComponentFixture<StackHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StackHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(StackHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    document.body.style.overflow = '';
  });

  const openBoth = async (): Promise<void> => {
    (
      fixture.nativeElement.querySelector('#stack-trigger') as HTMLElement
    ).focus();
    fixture.componentInstance.firstOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.secondOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  const openThree = async (): Promise<void> => {
    await openBoth();
    fixture.componentInstance.thirdOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  it('lets only the top-most dialog handle Escape and restores in stack order', async () => {
    await openBoth();
    const firstAction = fixture.nativeElement.querySelector(
      '#stack-first-action',
    ) as HTMLButtonElement;
    const secondAction = fixture.nativeElement.querySelector(
      '#stack-second-action',
    ) as HTMLButtonElement;

    expect(document.activeElement).toBe(secondAction);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.secondOpen()).toBeFalse();
    expect(fixture.componentInstance.firstOpen()).toBeTrue();
    expect(document.activeElement).toBe(firstAction);
  });

  it('keeps focus trapping in the top-most dialog', async () => {
    await openBoth();
    const firstAction = fixture.nativeElement.querySelector(
      '#stack-first-action',
    ) as HTMLButtonElement;
    const secondAction = fixture.nativeElement.querySelector(
      '#stack-second-action',
    ) as HTMLButtonElement;

    firstAction.focus();
    expect(document.activeElement).toBe(secondAction);
    secondAction.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    expect(document.activeElement).toBe(secondAction);
  });

  it('keeps visual stacking aligned with open order even when DOM order differs', async () => {
    await openBoth();
    const first = fixture.nativeElement.querySelector(
      '[role="dialog"][aria-label="First dialog"]',
    ) as HTMLElement;
    const second = fixture.nativeElement.querySelector(
      '[role="dialog"][aria-label="Second dialog"]',
    ) as HTMLElement;
    const firstZIndex = Number.parseInt(
      getComputedStyle(first.parentElement!).zIndex,
      10,
    );
    const secondZIndex = Number.parseInt(
      getComputedStyle(second.parentElement!).zIndex,
      10,
    );

    expect(secondZIndex).toBeGreaterThan(firstZIndex);
    expect(document.activeElement?.id).toBe('stack-second-action');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.secondOpen()).toBeFalse();
    expect(getComputedStyle(first.parentElement!).zIndex).toBe('1000');
    expect(document.activeElement?.id).toBe('stack-first-action');
  });

  it('moves a reopened dialog to the visual and behavioral top', async () => {
    await openBoth();
    fixture.componentInstance.secondOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.secondOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const first = fixture.nativeElement.querySelector(
      '[role="dialog"][aria-label="First dialog"]',
    ) as HTMLElement;
    const second = fixture.nativeElement.querySelector(
      '[role="dialog"][aria-label="Second dialog"]',
    ) as HTMLElement;
    expect(
      Number.parseInt(getComputedStyle(second.parentElement!).zIndex, 10),
    ).toBeGreaterThan(
      Number.parseInt(getComputedStyle(first.parentElement!).zIndex, 10),
    );
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.secondOpen()).toBeFalse();
    expect(fixture.componentInstance.firstOpen()).toBeTrue();
  });

  it('promotes the next dialog when the visual top dialog is destroyed', async () => {
    await openThree();
    const third = fixture.nativeElement.querySelector(
      '[role="dialog"][aria-label="Third dialog"]',
    ) as HTMLElement;
    const second = fixture.nativeElement.querySelector(
      '[role="dialog"][aria-label="Second dialog"]',
    ) as HTMLElement;
    expect(
      Number.parseInt(getComputedStyle(third.parentElement!).zIndex, 10),
    ).toBeGreaterThan(
      Number.parseInt(getComputedStyle(second.parentElement!).zIndex, 10),
    );

    fixture.componentInstance.thirdOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getComputedStyle(second.parentElement!).zIndex).toBe('1001');
    expect(document.activeElement?.id).toBe('stack-second-action');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('destroying the top dialog preserves the lower trap and scroll lock', async () => {
    await openBoth();
    fixture.componentInstance.secondPresent.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.firstOpen()).toBeTrue();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.activeElement?.id).toBe('stack-first-action');

    fixture.componentInstance.firstOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe('');
  });

  it('transfers a lower dialog opener before restoring after the top closes', async () => {
    await openBoth();
    const trigger = fixture.nativeElement.querySelector(
      '#stack-trigger',
    ) as HTMLButtonElement;

    fixture.componentInstance.firstOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.secondOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(trigger);
  });
});
