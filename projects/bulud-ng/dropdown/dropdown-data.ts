import {
  afterRenderEffect,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  ViewContainerRef,
  EmbeddedViewRef,
  untracked,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NgControl,
} from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, switchMap } from 'rxjs';
import { BuludDropdown } from './bulud-dropdown/bulud-dropdown';
import { BuludRuntime } from 'bulud-ng/runtime';
import { BULUD_DROPDOWN_DATA_CONFIG } from 'bulud-ng';
export { BULUD_DROPDOWN_DATA_CONFIG } from 'bulud-ng';
export type { BuludDropdownDataConfig } from 'bulud-ng';
const UNWRITTEN = Symbol('unwritten');
function field(value: unknown, key: string | undefined): unknown {
  return value !== null && typeof value === 'object' && key
    ? (value as Record<string, unknown>)[key]
    : undefined;
}
@Directive({
  selector: 'bulud-dropdown[buludDropdownData]',
  standalone: true,
  exportAs: 'buludDropdownData',
  host: { '[class.angour-dropdown--dynamic]': 'dynamicInput()' },
})
export class BuludDropdownData implements ControlValueAccessor {
  private readonly dropdown = inject<BuludDropdown<unknown>>(BuludDropdown);
  private readonly ngControl = inject(NgControl, {
    self: true,
    optional: true,
  });
  private readonly config = inject(BULUD_DROPDOWN_DATA_CONFIG);
  private readonly runtime = inject(BuludRuntime);
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly views = inject(ViewContainerRef);
  private readonly destroyed = inject(DestroyRef);
  readonly valueField = input<string>();
  readonly textField = input<string>();
  readonly panelClass = input('');
  readonly control = input<AbstractControl>();
  readonly dynamicInput = input(false);
  readonly selectedItem = input<unknown>();
  readonly selectedItems = input<readonly unknown[]>();
  readonly selectedItemChange = output<unknown>();
  readonly selectedItemsChange = output<unknown[]>();
  readonly controlBlur = output<void>();
  private readonly searchTemplate = contentChild<TemplateRef<unknown>>(
    'searchInputTemplate',
  );
  private readonly formValue = signal<unknown>(UNWRITTEN);
  private readonly selection = signal<unknown>(null);
  private readonly touched = signal(false);
  private readonly panel = signal<HTMLElement | null>(null);
  private readonly searchRevision = signal(0);
  private searchView?: EmbeddedViewRef<unknown>;
  private observer?: MutationObserver;
  private removeOutside?: () => void;
  private frame?: number;
  private onChange: (value: unknown) => void = () => {};
  private onTouched = () => {};
  private readonly controlEvents = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) => control?.events ?? EMPTY),
    ),
    { initialValue: null },
  );
  readonly compare = (left: unknown, right: unknown): boolean => {
    const key = this.valueField();
    return key && left != null && right != null
      ? field(left, key) == field(right, key)
      : left === right;
  };
  readonly optionLabel = (option: unknown): string => {
    const value = field(option, this.textField());
    return typeof value === 'string' ? this.runtime.text(value, value) : '';
  };
  get invalid(): boolean {
    this.controlEvents();
    const control = this.control();
    if (!control) return false;
    const values = this.selection();
    if (
      this.dynamicInput() &&
      Array.isArray(values) &&
      values.some((item) => {
        const child = this.config.childControl?.(control, item);
        return child?.invalid && (child.touched || this.touched());
      })
    )
      return true;
    return control.invalid && (control.touched || this.touched());
  }
  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
    this.dropdown.registerOnChange((value) => this.select(value));
    this.dropdown.registerOnTouched(() => {
      if (this.panel()) this.markTouched();
    });
    effect(() => {
      const value = this.selectedItems() ?? this.selectedItem() ?? null;
      untracked(() => this.selection.set(value));
    });
    effect(() => {
      const options = this.dropdown.options() ?? [],
        value = this.formValue(),
        selection = this.selection(),
        key = this.valueField();
      let resolved = selection;
      if (value !== UNWRITTEN && key) {
        resolved = this.dropdown.multiple()
          ? Array.isArray(value)
            ? options.filter((option) =>
                value.some((item) => item == field(option, key)),
              )
            : []
          : (options.find((option) => field(option, key) == value) ??
            (selection != null && field(selection, key) == value
              ? selection
              : null));
      }
      this.dropdown.writeValue(
        resolved ?? (this.dropdown.multiple() ? [] : null),
      );
    });
    const block = (event: MouseEvent) => {
      if (
        this.dynamicInput() &&
        event.target instanceof Element &&
        event.target.closest('.bulud-dropdown__option')
      )
        event.stopPropagation();
    };
    this.host.addEventListener('click', block, true);
    afterRenderEffect(() => {
      const win = this.host.ownerDocument.defaultView;
      if (!this.observer && win) {
        this.observer = new win.MutationObserver(() => {
          if (this.frame !== undefined) return;
          this.frame = win.requestAnimationFrame(() => {
            this.frame = undefined;
            if (!this.destroyed.destroyed) this.syncPanel();
          });
        });
        this.observer.observe(this.host, { childList: true, subtree: true });
      }
      const panel = this.panel(),
        template = this.searchTemplate();
      if (panel && template && !this.searchView) {
        this.searchView = this.views.createEmbeddedView(template);
        for (const node of [...this.searchView.rootNodes].reverse())
          panel.insertBefore(node, panel.firstChild);
        this.searchRevision.update((v) => v + 1);
      }
    });
    afterRenderEffect(() => {
      this.searchRevision();
      const panel = this.panel();
      if (this.searchView)
        panel?.querySelector<HTMLInputElement>('input[type=text]')?.focus();
    });
    this.destroyed.onDestroy(() => {
      this.observer?.disconnect();
      this.removeOutside?.();
      this.host.removeEventListener('click', block, true);
      if (this.frame !== undefined)
        this.host.ownerDocument.defaultView?.cancelAnimationFrame(this.frame);
      this.removeSearchView();
    });
  }
  writeValue(value: unknown): void {
    this.formValue.set(value);
  }
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(value: boolean): void {
    this.dropdown.setDisabledState(value);
  }
  private select(value: unknown): void {
    this.selection.set(value);
    if (this.dropdown.multiple()) {
      this.selectedItemsChange.emit(Array.isArray(value) ? value : []);
      return;
    }
    if (this.valueField()) {
      const scalar = field(value, this.valueField());
      this.formValue.set(scalar);
      this.markTouched();
      this.onChange(scalar);
    }
    if (value == null)
      this.host
        .querySelector<HTMLButtonElement>(
          '.bulud-dropdown__trigger[aria-expanded="true"]',
        )
        ?.click();
    this.selectedItemChange.emit(value ?? undefined);
  }
  private markTouched(): void {
    this.touched.set(true);
    this.onTouched();
  }
  private syncPanel(): void {
    const panel = this.host.querySelector<HTMLElement>(
      '.bulud-dropdown__panel',
    );
    if (panel !== this.panel()) {
      this.removeOutside?.();
      this.removeOutside = undefined;
      this.removeSearchView();
      if (!panel && this.panel()) this.markTouched();
      this.panel.set(panel);
      if (panel) {
        const classes = this.panelClass().split(/\s+/).filter(Boolean);
        if (classes.length) panel.classList.add(...classes);
        const outside = (event: PointerEvent) => {
          if (
            !panel.isConnected ||
            !(event.target instanceof Node) ||
            this.host.contains(event.target)
          )
            return;
          this.markTouched();
          const control = this.control(),
            selected = this.selection();
          if (this.dynamicInput() && control?.parent) {
            for (const item of Array.isArray(selected) ? selected : []) {
              const child = this.config.childControl?.(control, item);
              child?.markAsTouched({ onlySelf: true });
              child?.updateValueAndValidity({ onlySelf: true });
            }
            control.markAsTouched({ onlySelf: true });
            control.updateValueAndValidity({ onlySelf: true });
          }
          this.controlBlur.emit();
        };
        this.host.ownerDocument.addEventListener('pointerdown', outside, true);
        this.removeOutside = () =>
          this.host.ownerDocument.removeEventListener(
            'pointerdown',
            outside,
            true,
          );
      }
    }
    if (panel) {
      panel.style.top = '100%';
      panel.style.bottom = 'unset';
      if (
        panel.getBoundingClientRect().bottom >
        (this.host.ownerDocument.defaultView?.innerHeight ?? Infinity)
      ) {
        panel.style.bottom = '100%';
        panel.style.top = 'unset';
      }
    }
  }
  private removeSearchView(): void {
    if (!this.searchView) return;
    const index = this.views.indexOf(this.searchView);
    if (index >= 0) this.views.remove(index);
    this.searchView = undefined;
  }
}
