import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
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
import { NgTemplateOutlet } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  ValidationErrors,
  Validator,
} from '@angular/forms';

import { BULUD_LOCALE } from 'bulud-ng';

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
    '[class.bulud-dropdown-host--open]': 'open()',
    '[class.bulud-dropdown-host--disabled]': 'isDisabled()',
    '(focusout)': 'handleFocusOut($event)',
    '(document:pointerdown)': 'handleDocumentPointerDown($event)',
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
  private readonly triggerElement = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly optionElements =
    viewChildren<ElementRef<HTMLButtonElement>>('option');
  protected readonly instanceId = `bulud-dropdown-${BuludDropdown.nextId++}`;

  /** Options rendered in the listbox. */
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
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Converts an option into searchable and default visible text. */
  readonly optionLabel = input<(option: T) => string>((option) =>
    String(option),
  );

  /** Compares options and selected values. */
  readonly compareWith = input<(left: T, right: T) => boolean>(
    (left, right) => Object.is(left, right),
  );

  /** Optional custom option template declared as `#optionTemplate`. */
  readonly optionTemplate = contentChild<
    TemplateRef<BuludDropdownOptionTemplateContext<T>>
  >('optionTemplate');

  /** Optional custom selected-value template declared as `#selectedTemplate`. */
  readonly selectedTemplate = contentChild<
    TemplateRef<BuludDropdownSelectedTemplateContext<T>>
  >('selectedTemplate');

  protected readonly open = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly activeOptionIndex = signal(-1);
  private readonly formDisabled = signal(false);
  private onChange: (value: T | readonly T[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected isDisabled(): boolean {
    return this.disabled() || this.formDisabled();
  }

  protected isInvalid(): boolean {
    const control = this.injector.get(NgControl, null, {
      self: true,
      optional: true,
    })?.control;
    return Boolean(control?.invalid && (control.touched || control.dirty));
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

  protected readonly filteredOptions = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();

    if (!term) {
      return this.options();
    }

    return this.options().filter((option) =>
      this.optionLabel()(option).toLocaleLowerCase().includes(term),
    );
  });

  protected readonly triggerLabel = computed(() => {
    const selected = this.selectedOptions();

    if (selected.length === 0) {
      return this.placeholder() ?? this.locale.dropdown.placeholder;
    }

    if (this.multiple()) {
      return this.locale.dropdown.selectedText(selected.length);
    }

    return this.optionLabel()(selected[0]);
  });

  protected toggle(): void {
    if (this.isDisabled()) {
      return;
    }

    if (this.open()) {
      this.close();
      this.onTouched();
      return;
    }

    this.openDropdown();
  }

  private openDropdown(): void {
    this.open.set(true);
    this.setActiveFromSelection();
    if (this.searchable()) {
      runInInjectionContext(this.injector, () => {
        afterNextRender(() => this.searchInput()?.nativeElement.focus());
      });
    }
  }

  protected optionId(index: number): string {
    return `${this.instanceId}-option-${index}`;
  }

  protected activeOptionId(): string | null {
    const index = this.activeOptionIndex();
    return index >= 0 && index < this.filteredOptions().length
      ? this.optionId(index)
      : null;
  }

  protected isActive(index: number): boolean {
    return this.activeOptionIndex() === index;
  }

  private setActiveFromSelection(): void {
    const selected = this.selectedOptions()[0];
    const options = this.filteredOptions();
    const index = selected === undefined
      ? 0
      : options.findIndex((option) => this.isSameOption(option, selected));
    this.activeOptionIndex.set(options.length === 0 ? -1 : Math.max(index, 0));
  }

  private moveActive(delta: number): void {
    const count = this.filteredOptions().length;
    if (count === 0) {
      this.activeOptionIndex.set(-1);
      return;
    }
    const current = this.activeOptionIndex();
    const next = current < 0 ? (delta > 0 ? 0 : count - 1) : current + delta;
    this.activeOptionIndex.set((next + count) % count);
  }

  private focusActiveOption(): void {
    this.optionElements()[this.activeOptionIndex()]?.nativeElement.focus();
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
    if (this.multiple()) {
      const selected = this.selectedOptions();
      const index = selected.findIndex((item) => this.isSameOption(item, option));
      const next = index === -1
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
    const next = this.multiple() ? [] : null;
    this.value.set(next);
    this.onChange(next);
  }

  protected isSelected(option: T): boolean {
    return this.selectedOptions().some((selected) =>
      this.isSameOption(selected, option),
    );
  }

  protected handleOptionKeydown(event: KeyboardEvent, option: T): void {
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
      this.onTouched();
    }
  }

  protected handleSearchKeydown(event: KeyboardEvent): void {
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
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.selectActiveOption();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.onTouched();
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
      this.close();
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
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  validate(): ValidationErrors | null {
    if (!this.required()) {
      return null;
    }
    const value = this.value();
    const empty = value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0);
    return empty ? { required: true } : null;
  }
}
