import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  model,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bulud-dropdown-host',
    '[class.bulud-dropdown-host--open]': 'open()',
    '[class.bulud-dropdown-host--disabled]': 'disabled()',
    '(focusout)': 'handleFocusOut($event)',
  },
  templateUrl: './bulud-dropdown.html',
  styleUrl: './bulud-dropdown.scss',
})
export class BuludDropdown<T = unknown> {

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

  /** Shows a loading state instead of options. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Text shown when no option is selected. */
  readonly placeholder = input('Select an option');

  /** Placeholder shown inside the search field. */
  readonly searchPlaceholder = input('Search options');

  /** Text shown when filtering returns no options. */
  readonly noResultsText = input('No options found');

  /** Text shown while options are loading. */
  readonly loadingText = input('Loading options…');

  /** Text shown when the option collection is empty. */
  readonly emptyText = input('No options available');

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
      return this.placeholder();
    }

    if (this.multiple()) {
      return `${selected.length} selected`;
    }

    return this.optionLabel()(selected[0]);
  });

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }

    this.open.update((open) => !open);

    if (!this.open()) {
      this.searchTerm.set('');
    }
  }

  protected openFromKeyboard(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      this.open.set(true);
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
      return;
    }

    this.value.set(option);
    this.close();
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.value.set(this.multiple() ? [] : null);
  }

  protected isSelected(option: T): boolean {
    return this.selectedOptions().some((selected) =>
      this.isSameOption(selected, option),
    );
  }

  protected handleOptionKeydown(event: KeyboardEvent, option: T): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectOption(option);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  protected handleSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
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
      this.close();
    }
  }

  private close(): void {
    this.open.set(false);
    this.searchTerm.set('');
  }

  private isSameOption(left: T, right: T): boolean {
    return this.compareWith()(left, right);
  }
}
