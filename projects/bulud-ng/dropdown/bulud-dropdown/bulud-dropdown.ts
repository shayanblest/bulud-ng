import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  Renderer2,
  untracked,
  contentChild,
  ElementRef,
  effect,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  runInInjectionContext,
  signal,
  TemplateRef,
  viewChild,
  viewChildren,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { defer, EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { BULUD_LOCALE, resolveBuludLocale } from 'bulud-ng';

/**
 * Context exposed to an option template.
 *
 * Use it with:
 * `<ng-template #optionTemplate let-option let-selected="selected">`.
 */
export interface BuludDropdownOptionTemplateContext<T> {
  readonly $implicit: T;
  readonly option: T;
  readonly selected: boolean;
}

/**
 * Context exposed to the selected-value template.
 */
export interface BuludDropdownSelectedTemplateContext<T> {
  readonly $implicit: T | readonly T[] | null;
  readonly value: T | readonly T[] | null;
  readonly multiple: boolean;
}

/**
 * A reusable dropdown with search, multiple selection, and projected templates.
 *
 * The model is a single option in single-select mode and an array in
 * multiple-select mode.
 */
@Component({
  selector: 'bulud-dropdown',
  imports: [NgTemplateOutlet],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BuludDropdown),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BuludDropdown),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bulud-dropdown-host',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
    '[attr.aria-errormessage]': 'null',
    '[class.bulud-dropdown-host--open]': 'open()',
    '[class.bulud-dropdown-host--disabled]': 'isDisabled()',
    '[class.bulud-dropdown-host--invalid]': 'isInvalid()',
    '(focusout)': 'handleFocusOut($event)',
  },
  templateUrl: './bulud-dropdown.html',
  styleUrl: './bulud-dropdown.scss',
})
export class BuludDropdown<T = unknown>
  implements ControlValueAccessor, Validator
{
  private static nextId = 0;

  protected readonly locale = inject(BULUD_LOCALE);
  private readonly injector = inject(Injector);
  private readonly triggerElement =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly searchInput =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly optionElements =
    viewChildren<ElementRef<HTMLButtonElement>>('option');
  protected readonly instanceId = `bulud-dropdown-${BuludDropdown.nextId++}`;

  /** Options rendered in the listbox. */
  readonly language = input<string | undefined>(undefined);
  protected readonly resolvedLocale = computed(() =>
    this.language()
      ? resolveBuludLocale({ language: this.language() })
      : this.locale,
  );
  readonly options = input<readonly T[]>([]);

  /** Selected option or selected options. */
  readonly value = model<T | readonly T[] | null>(null);

  /** Enables array-valued selection and keeps the panel open after selection. */
  readonly multiple = input(false, { transform: booleanAttribute });

  /** Enables the search field above the option list. */
  readonly searchable = input(true, { transform: booleanAttribute });

  /** Allows the selected value to be cleared with a dedicated action. */
  readonly clearable = input(true, { transform: booleanAttribute });

  /** Prevents interaction and opening. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Requires at least one selected value when used with Angular Forms. */
  readonly required = input(false, { transform: booleanAttribute });

  /** Explicit invalid state for forms managed by the consumer. */
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly ariaDescribedby = input<string | null>(null, {
    alias: 'aria-describedby',
  });
  readonly ariaErrormessage = input<string | null>(null, {
    alias: 'aria-errormessage',
  });
  /** Optional count constraints for multiple selection. */
  readonly minSelected = input<number | null>(null);
  readonly maxSelected = input<number | null>(null);
  /** Validate membership after asynchronous options finish loading. */
  readonly requireOption = input(false, { transform: booleanAttribute });

  /** Shows a loading state instead of options. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Text shown when no option is selected. */
  readonly placeholder = input<string | undefined>(undefined);

  /** Placeholder shown inside the search field. */
  readonly searchPlaceholder = input<string | undefined>(undefined);

  /** Text shown when filtering returns no options. */
  readonly noResultsText = input<string | undefined>(undefined);

  /** Text shown while options are loading. */
  readonly loadingText = input<string | undefined>(undefined);

  /** Text shown when the option collection is empty. */
  readonly emptyText = input<string | undefined>(undefined);

  /** Accessible label for the clear-selection action. */
  readonly clearLabel = input<string | undefined>(undefined);

  /** Accessible label for the search field. */
  readonly searchLabel = input<string | undefined>(undefined);

  /** Accessible label for the trigger. */
  readonly inputId = input<string | null>(null);
  readonly ariaLabelledby = input<string | null>(null, {
    alias: 'aria-labelledby',
  });
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Converts an option into searchable and default visible text. */
  readonly optionLabel = input<(option: T) => string>((option) =>
    String(option),
  );

  /** Compares options and selected values. */
  readonly compareWith = input<(left: T, right: T) => boolean>((left, right) =>
    Object.is(left, right),
  );

  /** Marks options unavailable without changing the option collection. */
  readonly optionDisabled = input<(option: T) => boolean>(() => false);

  /** Optional custom option template declared as `#optionTemplate`. */
  readonly optionTemplate =
    contentChild<TemplateRef<BuludDropdownOptionTemplateContext<T>>>(
      'optionTemplate',
    );

  /** Optional custom selected-value template declared as `#selectedTemplate`. */
  readonly selectedTemplate =
    contentChild<TemplateRef<BuludDropdownSelectedTemplateContext<T>>>(
      'selectedTemplate',
    );

  protected readonly open = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly activeOptionIndex = signal(-1);
  private readonly formDisabled = signal(false);
  private readonly formBindingVersion = signal<number | null>(null);
  private formBindingCount = 0;
  private readonly formEvents = toSignal(
    toObservable(this.formBindingVersion).pipe(
      switchMap((version) =>
        version === null
          ? EMPTY
          : defer(() => this.getFormControl()?.events ?? EMPTY),
      ),
    ),
    { initialValue: null },
  );
  private onChange: (value: T | readonly T[] | null) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  constructor() {
    const renderer = inject(Renderer2);
    const document = inject(DOCUMENT);
    effect((onCleanup) => {
      if (!this.open()) return;
      onCleanup(
        renderer.listen(document, 'pointerdown', (event: PointerEvent) =>
          this.handleDocumentPointerDown(event),
        ),
      );
    });
    effect(() => {
      if (this.isDisabled()) untracked(() => this.close(false));
    });
    effect(() => {
      this.required();
      this.multiple();
      this.minSelected();
      this.maxSelected();
      this.requireOption();
      this.options();
      this.loading();
      this.compareWith();
      untracked(() => this.onValidatorChange());
    });
    effect(() => {
      const options = this.filteredOptions();
      const activeIndex = this.activeOptionIndex();

      if (this.loading() || options.length === 0) {
        this.restoreFocusFromRemovedOption();
        this.activeOptionIndex.set(-1);
      } else if (this.open() && activeIndex < 0) {
        this.setActiveFromSelection();
      } else if (activeIndex >= options.length) {
        this.activeOptionIndex.set(-1);
      }
    });
  }

  protected isDisabled(): boolean {
    return this.disabled() || this.formDisabled();
  }

  protected isInvalid(): boolean {
    this.formEvents();
    const control = this.getFormControl();
    return (
      this.invalid() ||
      Boolean(control?.invalid && (control.touched || control.dirty))
    );
  }

  private getFormControl() {
    return this.injector.get(NgControl, null, {
      self: true,
      optional: true,
    })?.control;
  }

  protected readonly selectedOptions = computed<readonly T[]>(() => {
    const value = this.value();

    if (this.multiple()) {
      return Array.isArray(value)
        ? (value as readonly T[])
        : value === null
          ? []
          : [value as T];
    }

    return value === null || Array.isArray(value) ? [] : [value as T];
  });

  private readonly searchIndex = computed(() =>
    this.options().map((option) => ({
      option,
      label: this.optionLabel()(option).toLocaleLowerCase(),
    })),
  );
  protected readonly filteredOptions = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();
    return term
      ? this.searchIndex()
          .filter((item) => item.label.includes(term))
          .map((item) => item.option)
      : this.options();
  });

  protected readonly triggerLabel = computed(() => {
    const selected = this.selectedOptions();

    if (selected.length === 0) {
      return this.placeholder() ?? this.resolvedLocale().dropdown.placeholder;
    }

    if (this.multiple()) {
      return this.resolvedLocale().dropdown.selectedText(selected.length);
    }

    return this.optionLabel()(selected[0]);
  });

  protected toggle(): void {
    if (this.isDisabled()) {
      return;
    }

    if (this.open()) {
      this.close();
      return;
    }

    this.openDropdown();
  }

  private openDropdown(): void {
    this.open.set(true);
    this.setActiveFromSelection();
    if (this.searchable()) {
      const trigger = this.triggerElement()?.nativeElement;
      const activeAtOpen = trigger?.ownerDocument.activeElement;
      runInInjectionContext(this.injector, () => {
        afterNextRender(() => {
          if (!this.open() || this.isDisabled()) return;
          const active = trigger?.ownerDocument.activeElement;
          if (
            active !== activeAtOpen &&
            active &&
            !trigger?.closest('bulud-dropdown')?.contains(active)
          ) {
            this.close(false);
            return;
          }
          this.searchInput()?.nativeElement.focus();
        });
      });
    }
  }

  protected optionId(index: number): string {
    return `${this.instanceId}-option-${index}`;
  }

  protected hasRenderedListbox(): boolean {
    return this.open() && !this.loading() && this.filteredOptions().length > 0;
  }

  protected activeOptionId(): string | null {
    const index = this.activeOptionIndex();
    if (!this.hasRenderedListbox() || index < 0) {
      return null;
    }

    return this.optionElements()[index]?.nativeElement.id ?? null;
  }

  protected isActive(index: number): boolean {
    return this.activeOptionIndex() === index;
  }

  private setActiveFromSelection(): void {
    const selected = this.selectedOptions()[0];
    const options = this.filteredOptions();
    const index =
      selected === undefined
        ? 0
        : options.findIndex((option) => this.isSameOption(option, selected));
    this.activeOptionIndex.set(
      options.length === 0 ? -1 : index >= 0 ? index : 0,
    );
  }

  private moveActive(delta: number): void {
    const count = this.filteredOptions().length;
    if (count === 0) {
      this.activeOptionIndex.set(-1);
      return;
    }
    const current = this.activeOptionIndex();
    const start = current < 0 ? (delta > 0 ? 0 : count - 1) : current + delta;
    this.activeOptionIndex.set((start + count) % count);
  }

  private focusActiveOption(): void {
    this.optionElements()[this.activeOptionIndex()]?.nativeElement.focus();
  }

  private restoreFocusFromRemovedOption(): void {
    const trigger = this.triggerElement()?.nativeElement;
    const activeElement = trigger?.ownerDocument.activeElement;

    if (
      !trigger ||
      !activeElement ||
      activeElement.getAttribute('role') !== 'option' ||
      !trigger.closest('bulud-dropdown')?.contains(activeElement)
    ) {
      return;
    }

    if (this.searchable() && this.open()) {
      this.searchInput()?.nativeElement.focus();
    } else {
      trigger.focus();
    }
  }

  private syncActiveOptionToFocus(event: KeyboardEvent): void {
    const focusedIndex = this.optionElements().findIndex(
      (option) => option.nativeElement === event.currentTarget,
    );

    if (focusedIndex >= 0) {
      this.activeOptionIndex.set(focusedIndex);
    }
  }

  protected handleSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.setActiveFromSelection();
  }

  private selectActiveOption(): void {
    const option = this.filteredOptions()[this.activeOptionIndex()];
    if (option !== undefined) {
      this.selectOption(option);
    }
  }

  protected handleDocumentPointerDown(event: PointerEvent): void {
    const target = event.target;
    const host = this.triggerElement()?.nativeElement.closest('bulud-dropdown');
    if (target instanceof Node && host && !host.contains(target)) {
      this.close(false);
    }
  }

  protected openFromKeyboard(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      return;
    }

    if (
      !this.open() &&
      (event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === ' ')
    ) {
      event.preventDefault();
      this.openDropdown();
      return;
    }

    if (!this.open()) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActive(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.activeOptionIndex.set(this.filteredOptions().length > 0 ? 0 : -1);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.activeOptionIndex.set(this.filteredOptions().length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectActiveOption();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  protected selectOption(option: T): void {
    if (this.isDisabled() || this.loading() || this.isOptionDisabled(option)) {
      return;
    }

    const optionIndex = this.filteredOptions().findIndex((item) =>
      this.isSameOption(item, option),
    );
    if (optionIndex >= 0) {
      this.activeOptionIndex.set(optionIndex);
    }

    if (this.multiple()) {
      const selected = this.selectedOptions();
      const index = selected.findIndex((item) =>
        this.isSameOption(item, option),
      );
      const next =
        index === -1
          ? [...selected, option]
          : selected.filter((_, itemIndex) => itemIndex !== index);

      this.value.set(next);
      this.onChange(next);
      return;
    }

    this.value.set(option);
    this.onChange(option);
    this.close();
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    if (this.isDisabled()) return;
    this.triggerElement()?.nativeElement.focus();
    const next = this.multiple() ? [] : null;
    this.value.set(next);
    this.onChange(next);
  }

  protected isSelected(option: T): boolean {
    return this.selectedOptions().some((selected) =>
      this.isSameOption(selected, option),
    );
  }

  protected isOptionDisabled(option: T): boolean {
    return this.optionDisabled()(option);
  }

  protected handleOptionKeydown(event: KeyboardEvent, option: T): void {
    this.syncActiveOptionToFocus(event);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveActive(1);
      this.focusActiveOption();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActive(-1);
      this.focusActiveOption();
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      this.activeOptionIndex.set(this.filteredOptions().length > 0 ? 0 : -1);
      this.focusActiveOption();
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      this.activeOptionIndex.set(this.filteredOptions().length - 1);
      this.focusActiveOption();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectOption(option);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  protected handleSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveActive(1);
      this.focusActiveOption();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActive(-1);
      this.focusActiveOption();
    } else if (event.key === 'Home' || event.key === 'End') {
      // Home and End retain their native text-editing behavior in search.
      return;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.selectActiveOption();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  protected handleFocusOut(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget;

    const currentTarget = event.currentTarget;

    if (
      !(currentTarget instanceof HTMLElement) ||
      !(relatedTarget instanceof Node) ||
      !currentTarget.contains(relatedTarget)
    ) {
      this.close(false);
      this.onTouched();
    }
  }

  private close(restoreFocus = true): void {
    this.open.set(false);
    this.searchTerm.set('');
    this.activeOptionIndex.set(-1);
    if (restoreFocus) {
      this.triggerElement()?.nativeElement.focus();
    }
  }

  private isSameOption(left: T, right: T): boolean {
    return this.compareWith()(left, right);
  }

  writeValue(value: T | readonly T[] | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: T | readonly T[] | null) => void): void {
    this.onChange = fn;
    this.formBindingVersion.set(++this.formBindingCount);
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  validate(): ValidationErrors | null {
    const value = this.value();
    const empty =
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0);
    if (this.required() && empty) return { required: true };
    if (value != null && this.multiple() !== Array.isArray(value))
      return { selectionType: { multiple: this.multiple() } };
    const selected = this.selectedOptions();
    if (this.multiple()) {
      const min = this.minSelected(),
        max = this.maxSelected();
      if (
        [min, max].some(
          (bound) =>
            bound !== null && (!Number.isSafeInteger(bound) || bound < 0),
        ) ||
        (min !== null && max !== null && min > max)
      )
        return { selectionBounds: true };
      if (min !== null && selected.length < min)
        return { minSelected: { min, actual: selected.length } };
      if (max !== null && selected.length > max)
        return { maxSelected: { max, actual: selected.length } };
    }
    if (
      this.requireOption() &&
      !this.loading() &&
      selected.some(
        (item) =>
          !this.options().some((option) => this.isSameOption(option, item)),
      )
    )
      return { option: true };
    return null;
  }
}
