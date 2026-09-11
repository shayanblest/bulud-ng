import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BuludDropdown } from './bulud-dropdown';

interface TestOption {
  readonly id: string;
  readonly label: string;
  readonly category: string;
}

@Component({
  imports: [BuludDropdown],
  template: `
    <bulud-dropdown
      aria-label="Choose a framework"
      [options]="options"
      [multiple]="multiple()"
      [searchable]="searchable()"
      [placeholder]="placeholder()"
      [clearLabel]="clearLabel()"
      [searchLabel]="searchLabel()"
      [optionLabel]="optionLabel"
      [(value)]="value"
    >
      <ng-template #optionTemplate let-option let-selected="selected">
        <span class="custom-option">
          {{ option.label }} · {{ option.category }}
          @if (selected) {
            <strong>selected</strong>
          }
        </span>
      </ng-template>
    </bulud-dropdown>
  `,
})
class TestHost {
  readonly options: readonly TestOption[] = [
    { id: 'angular', label: 'Angular', category: 'Framework' },
    { id: 'react', label: 'React', category: 'Framework' },
    { id: 'tailwind', label: 'Tailwind', category: 'CSS' },
  ];
  readonly value = signal<TestOption | readonly TestOption[] | null>(null);
  readonly multiple = signal(false);
  readonly searchable = signal(true);
  readonly placeholder = signal<string | undefined>(undefined);
  readonly clearLabel = signal<string | undefined>(undefined);
  readonly searchLabel = signal<string | undefined>(undefined);
  readonly optionLabel = (option: TestOption): string => option.label;
}

@Component({
  imports: [BuludDropdown, ReactiveFormsModule],
  template: `
    <bulud-dropdown
      required
      [options]="options"
      [optionLabel]="optionLabel"
      [formControl]="control"
    />
  `,
})
class FormsHost {
  readonly options: readonly TestOption[] = [
    { id: 'angular', label: 'Angular', category: 'Framework' },
    { id: 'react', label: 'React', category: 'Framework' },
  ];
  readonly control = new FormControl<TestOption | null>(null);
  readonly optionLabel = (option: TestOption): string => option.label;
}

@Component({
  imports: [BuludDropdown, FormsModule],
  template: `
    <bulud-dropdown
      [options]="options"
      [optionLabel]="optionLabel"
      [(ngModel)]="value"
    />
  `,
})
class TemplateFormsHost {
  readonly options: readonly TestOption[] = [
    { id: 'angular', label: 'Angular', category: 'Framework' },
    { id: 'react', label: 'React', category: 'Framework' },
  ];
  value: TestOption | null = null;
  readonly optionLabel = (option: TestOption): string => option.label;
}

describe('BuludDropdown', () => {
  let fixture: ComponentFixture<TestHost>;

  const getDropdown = (): HTMLElement => {
    const element = fixture.nativeElement.querySelector('bulud-dropdown');

    if (!(element instanceof HTMLElement)) {
      throw new Error('Expected a bulud-dropdown host element.');
    }

    return element;
  };

  const getTrigger = (): HTMLButtonElement => {
    const button = getDropdown().querySelector(
      '.bulud-dropdown__trigger',
    );

    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('Expected a dropdown trigger button.');
    }

    return button;
  };

  const getOptions = (): readonly HTMLButtonElement[] =>
    Array.from(
      getDropdown().querySelectorAll<HTMLButtonElement>(
        '.bulud-dropdown__option',
      ),
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  it('renders a closed accessible combobox trigger', () => {
    const trigger = getTrigger();

    expect(trigger.getAttribute('role')).toBe('combobox');
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toMatch(
      /^bulud-dropdown-\d+-listbox$/,
    );
    expect(trigger.textContent).toContain('Select an option');
  });

  it('supports active-option keyboard navigation and selection', () => {
    const trigger = getTrigger();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();

    const options = getOptions();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-activedescendant')).toBe(
      options[0].id,
    );
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-activedescendant')).toBe(options[2].id);
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect((fixture.componentInstance.value() as TestOption).id).toBe(
      'tailwind',
    );
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Escape and restores focus to the trigger', () => {
    const trigger = getTrigger();
    trigger.click();
    fixture.detectChanges();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('moves focus and selects the navigated option when an option has focus', () => {
    const trigger = getTrigger();
    trigger.click();
    fixture.detectChanges();

    const options = getOptions();
    options[0].focus();
    options[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    fixture.detectChanges();

    expect(document.activeElement).toBe(options[1]);

    options[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(options[2]);

    options[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();

    expect((fixture.componentInstance.value() as TestOption).id).toBe(
      'tailwind',
    );
    expect(document.activeElement).toBe(trigger);
  });

  it('handles every option navigation key from the focused option', () => {
    fixture.componentInstance.searchable.set(false);
    fixture.detectChanges();

    const trigger = getTrigger();
    trigger.click();
    fixture.detectChanges();

    const options = getOptions();
    options[1].focus();
    options[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
    );
    expect(document.activeElement).toBe(options[0]);

    options[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    );
    expect(document.activeElement).toBe(options[0]);

    options[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
    );
    expect(document.activeElement).toBe(options[2]);

    options[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(options[0]);

    options[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    expect(document.activeElement).toBe(options[2]);
  });

  it('integrates with reactive forms for value, touched, and required state', () => {
    const formsFixture = TestBed.createComponent(FormsHost);
    formsFixture.detectChanges();
    const dropdown = formsFixture.nativeElement.querySelector('bulud-dropdown') as HTMLElement;
    const trigger = dropdown.querySelector('.bulud-dropdown__trigger') as HTMLButtonElement;

    expect(formsFixture.componentInstance.control.invalid).toBeTrue();
    trigger.click();
    formsFixture.detectChanges();
    dropdown.querySelector<HTMLButtonElement>('[role="option"]')?.click();
    formsFixture.detectChanges();

    expect(formsFixture.componentInstance.control.value?.id).toBe('angular');
    expect(formsFixture.componentInstance.control.valid).toBeTrue();

    formsFixture.componentInstance.control.setValue(null);
    formsFixture.detectChanges();
    trigger.focus();
    trigger.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: document.body,
      }),
    );
    formsFixture.detectChanges();
    expect(formsFixture.componentInstance.control.touched).toBeTrue();
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
  });

  it('receives disabled state from reactive forms and writes external values', () => {
    const formsFixture = TestBed.createComponent(FormsHost);
    formsFixture.detectChanges();
    const host = formsFixture.componentInstance;
    const dropdown = formsFixture.nativeElement.querySelector('bulud-dropdown') as HTMLElement;
    const trigger = dropdown.querySelector('.bulud-dropdown__trigger') as HTMLButtonElement;

    host.control.setValue(host.options[1]);
    formsFixture.detectChanges();
    expect(trigger.textContent).toContain('React');

    host.control.disable();
    formsFixture.detectChanges();
    expect(trigger.disabled).toBeTrue();
    expect(dropdown.classList.contains('bulud-dropdown-host--disabled')).toBeTrue();
  });

  it('integrates with template-driven ngModel forms', () => {
    const formsFixture = TestBed.createComponent(TemplateFormsHost);
    formsFixture.detectChanges();
    const dropdown = formsFixture.nativeElement.querySelector('bulud-dropdown') as HTMLElement;
    const trigger = dropdown.querySelector('.bulud-dropdown__trigger') as HTMLButtonElement;

    trigger.click();
    formsFixture.detectChanges();
    dropdown.querySelector<HTMLButtonElement>('[role="option"]')?.click();
    formsFixture.detectChanges();

    expect(formsFixture.componentInstance.value?.id).toBe('angular');
  });

  it('filters options with the searchable field', () => {
    getTrigger().click();
    fixture.detectChanges();

    const search = getDropdown().querySelector(
      '.bulud-dropdown__search input',
    );

    if (!(search instanceof HTMLInputElement)) {
      throw new Error('Expected a dropdown search input.');
    }

    search.value = 'tail';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(getOptions()).toHaveSize(1);
    expect(getOptions()[0].textContent).toContain('Tailwind');
  });

  it('focuses the search field when opened', async () => {
    getTrigger().click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(
      getDropdown().querySelector('.bulud-dropdown__search input'),
    );
  });

  it('updates the single selected value and closes after selection', () => {
    getTrigger().click();
    fixture.detectChanges();
    getOptions()[0].click();
    fixture.detectChanges();

    expect((fixture.componentInstance.value() as TestOption | null)?.id).toBe(
      'angular',
    );
    expect(getTrigger().getAttribute('aria-expanded')).toBe('false');
    expect(getTrigger().textContent).toContain('Angular');
  });

  it('keeps the panel open and toggles values in multiple mode', () => {
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    getTrigger().click();
    fixture.detectChanges();

    const options = getOptions();
    options[0].click();
    options[2].click();
    fixture.detectChanges();

    const value = fixture.componentInstance.value();

    expect(Array.isArray(value)).toBeTrue();
    expect(value).toHaveSize(2);
    expect(getTrigger().getAttribute('aria-expanded')).toBe('true');
    expect(getTrigger().textContent).toContain('2 selected');
  });

  it('uses locale defaults for visible and accessible text', () => {
    getTrigger().click();
    fixture.detectChanges();

    const search = getDropdown().querySelector('input');
    const clearHost = getDropdown();

    expect(getTrigger().textContent).toContain('Select an option');
    expect(search?.placeholder).toBe('Search options');
    expect(getDropdown().querySelector('.bulud-visually-hidden')?.textContent).toContain(
      'Search options',
    );

    fixture.componentInstance.value.set(fixture.componentInstance.options[0]);
    fixture.detectChanges();
    expect(
      clearHost
        .querySelector('.bulud-dropdown__clear')
        ?.getAttribute('aria-label'),
    ).toBe('Clear selection');
  });

  it('lets instance text overrides take precedence over locale defaults', () => {
    fixture.componentInstance.placeholder.set('Pick one');
    fixture.componentInstance.clearLabel.set('Remove choice');
    fixture.componentInstance.searchLabel.set('Find a choice');
    fixture.detectChanges();

    expect(getTrigger().textContent).toContain('Pick one');
    getTrigger().click();
    fixture.detectChanges();

    const search = getDropdown().querySelector('input');
    expect(search?.placeholder).toBe('Search options');
    expect(getDropdown().querySelector('.bulud-visually-hidden')?.textContent).toContain(
      'Find a choice',
    );

    fixture.componentInstance.value.set(fixture.componentInstance.options[0]);
    fixture.detectChanges();
    expect(
      getDropdown()
        .querySelector('.bulud-dropdown__clear')
        ?.getAttribute('aria-label'),
    ).toBe('Remove choice');
  });

  it('renders the consumer-projected option template', () => {
    getTrigger().click();
    fixture.detectChanges();

    expect(getOptions()[1].querySelector('.custom-option')?.textContent).toContain(
      'React · Framework',
    );
  });
});
