import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

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
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  it('renders a closed accessible combobox trigger', () => {
    const trigger = getTrigger();

    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.textContent).toContain('Select an option');
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

  it('updates the single selected value and closes after selection', () => {
    getTrigger().click();
    fixture.detectChanges();
    getOptions()[0].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()?.toString()).toContain('angular');
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

  it('renders the consumer-projected option template', () => {
    getTrigger().click();
    fixture.detectChanges();

    expect(getOptions()[1].querySelector('.custom-option')?.textContent).toContain(
      'React · Framework',
    );
  });
});
