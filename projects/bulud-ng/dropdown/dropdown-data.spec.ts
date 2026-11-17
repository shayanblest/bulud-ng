import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  FormControl,
  FormRecord,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { provideZonelessChangeDetection } from '@angular/core';
import { BULUD_DROPDOWN_DATA_CONFIG } from './dropdown-data';
import {BuludDropdown} from './bulud-dropdown/bulud-dropdown';
import { BuludDropdownData } from './dropdown-data';

@Component({
  standalone: true,
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- Explicit mutable consumer host for Angular Forms integration.
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BuludDropdown, BuludDropdownData, ReactiveFormsModule],
  template: `<form [formGroup]="form">
    <bulud-dropdown
      buludDropdownData
      #bridge="buludDropdownData"
      formControlName="code"
      [panelClass]="panelClass()"
      valueField="code"
      [options]="options()"
      [selectedItem]="selected"
      [searchable]="false"
      [clearable]="true"
      [compareWith]="bridge.compare"
      (selectedItemChange)="changes.push($event)"
    >
      <ng-template #selectedTemplate let-option>{{ option?.name }}</ng-template>
      <ng-template #optionTemplate let-option>{{ option.name }}</ng-template>
      <ng-template #searchInputTemplate
        ><input type="text" (input)="searches.push($any($event.target).value)"
      /></ng-template>
    </bulud-dropdown>
  </form>`,
})
class Host {
  panelClass = signal('');
  form = new FormGroup({
    code: new FormControl<string | number>('1', Validators.required),
  });
  options = signal([
    { code: 1, name: 'First' },
    { code: 2, name: 'Second' },
  ]);
  selected: unknown;
  changes: unknown[] = [];
  searches: string[] = [];
}

@Component({
  standalone: true,
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- Explicit mutable consumer host for Angular Forms integration.
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BuludDropdown, BuludDropdownData, ReactiveFormsModule],
  template: `<form [formGroup]="form">
    <bulud-dropdown
      buludDropdownData
      #bridge="buludDropdownData"
      valueField="code"
      formControlName="codes"
      [multiple]="true"
      [options]="options()"
      [selectedItems]="selected"
      [compareWith]="bridge.compare"
      (selectedItemsChange)="update($event)"
    >
      <ng-template #optionTemplate let-option>{{ option.name }}</ng-template>
    </bulud-dropdown>
  </form>`,
})
class MultipleHost {
  form = new FormGroup({
    codes: new FormControl<number[]>([], Validators.required),
  });
  options = signal([
    { code: 1, name: 'First' },
    { code: 2, name: 'Second' },
  ]);
  selected: unknown[] = [];
  update(options: unknown[]) {
    this.selected = options;
    this.form.controls.codes.setValue(
      options.map((option) => (option as { code: number }).code),
    );
  }
}

@Component({
  standalone: true,
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- Explicit mutable consumer host for Angular Forms integration.
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BuludDropdown, BuludDropdownData, ReactiveFormsModule],
  template: `<form [formGroup]="form">
    <bulud-dropdown
      buludDropdownData
      #bridge="buludDropdownData"
      valueField="value"
      formControlName="channels"
      [multiple]="true"
      [searchable]="false"
      [options]="options"
      [selectedItems]="selected"
      [dynamicInput]="true"
      [control]="form.controls['channels']"
    >
      <ng-template #optionTemplate let-option>
        <div tabindex="-1" (keydown)="$event.stopPropagation()">
          <input
            type="checkbox"
            [checked]="selected.length > 0"
            (change)="update($any($event.target).checked)"
          />
          @if (form.contains('addressTelegram')) {
            <input class="address" formControlName="addressTelegram" />
          }
        </div>
      </ng-template>
    </bulud-dropdown>
  </form>`,
})
class DynamicHost {
  form = new FormRecord<FormControl<unknown>>({
    channels: new FormControl<string[]>([], Validators.required),
  });
  options = [{ value: 'Telegram', name: 'Telegram' }];
  selected: { value: string; name: string }[] = [];
  update(checked: boolean) {
    this.selected = checked ? this.options : [];
    if (checked)
      this.form.addControl(
        'addressTelegram',
        new FormControl('', Validators.required),
      );
    else this.form.removeControl('addressTelegram');
    this.form.controls['channels'].setValue(
      this.selected.map((item) => item.value),
    );
  }
}

describe('Angour scalar values on the published Bulud dropdown', () => {
  let fixture: ComponentFixture<Host>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host, MultipleHost, DynamicHost],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_DROPDOWN_DATA_CONFIG,
          useValue: {
            childControl: (
              control: import('@angular/forms').AbstractControl,
              item: { value: unknown },
            ) => control.parent?.get('address' + item.value) ?? null,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });
  const click = (
    fixture: ComponentFixture<unknown>,
    selector: string,
    index = 0,
  ) => {
    (
      fixture.nativeElement.querySelectorAll(selector)[index] as HTMLElement
    ).click();
    fixture.detectChanges();
  };

  it('resolves scalar/string IDs without writing option objects into the form', () => {
    const dropdown = fixture.debugElement.query(By.directive(BuludDropdown))
      .componentInstance as BuludDropdown<unknown>;
    expect(dropdown.value()).toEqual({ code: 1, name: 'First' });
    expect(fixture.componentInstance.form.value.code).toBe('1');
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('emits the scalar once and the full option separately', () => {
    const values: unknown[] = [];
    fixture.componentInstance.form.controls.code.valueChanges.subscribe(
      (value) => values.push(value),
    );
    click(fixture, '.bulud-dropdown__trigger');
    click(fixture, '.bulud-dropdown__option', 1);
    expect(values).toEqual([2]);
    expect(fixture.componentInstance.changes).toEqual([
      { code: 2, name: 'Second' },
    ]);
    expect(fixture.componentInstance.form.controls.code.touched).toBe(true);
  });

  it('keeps server/API values while options arrive or get replaced', async () => {
    fixture.componentInstance.options.set([]);
    fixture.componentInstance.form.controls.code.setValue(2);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.options.set([{ code: 2, name: 'Reloaded' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    const dropdown = fixture.debugElement.query(By.directive(BuludDropdown))
      .componentInstance as BuludDropdown<unknown>;
    expect(dropdown.value()).toEqual({ code: 2, name: 'Reloaded' });
    expect(fixture.componentInstance.form.controls.code.value).toBe(2);
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('preserves undefined clear values and null form resets', async () => {
    click(fixture, '.bulud-dropdown__clear');
    expect(fixture.componentInstance.form.controls.code.value).toBeUndefined();
    expect(fixture.componentInstance.changes).toEqual([undefined]);
    fixture.componentInstance.form.reset();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.form.controls.code.value).toBeNull();
    const dropdown = fixture.debugElement.query(By.directive(BuludDropdown))
      .componentInstance as BuludDropdown<unknown>;
    expect(dropdown.value()).toBeNull();
  });

  it('respects programmatic disabled/enabled state', () => {
    fixture.componentInstance.form.disable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.bulud-dropdown__trigger').disabled,
    ).toBe(true);
    click(fixture, '.bulud-dropdown__trigger');
    expect(
      fixture.nativeElement.querySelector('.bulud-dropdown__panel'),
    ).toBeNull();
    fixture.componentInstance.form.enable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.bulud-dropdown__trigger').disabled,
    ).toBe(false);
  });

  it('does not duplicate the multiple-selection business handler valueChanges', async () => {
    const multiple = TestBed.createComponent(MultipleHost);
    multiple.detectChanges();
    await multiple.whenStable();
    const values: unknown[] = [];
    multiple.componentInstance.form.controls.codes.valueChanges.subscribe(
      (value) => values.push(value),
    );
    click(multiple, '.bulud-dropdown__trigger');
    click(multiple, '.bulud-dropdown__option', 0);
    expect(values).toEqual([[1]]);
    expect(multiple.componentInstance.selected).toEqual([
      { code: 1, name: 'First' },
    ]);
    expect(
      multiple.nativeElement.querySelector('.bulud-dropdown__panel'),
    ).not.toBeNull();
    click(multiple, '.bulud-dropdown__option', 0);
    expect(values).toEqual([[1], []]);
  });
  it('preserves zero-valued IDs', async () => {
    fixture.componentInstance.options.set([{ code: 0, name: 'Zero' }]);
    fixture.componentInstance.form.controls.code.setValue(0);
    fixture.detectChanges();
    await fixture.whenStable();
    const dropdown = fixture.debugElement.query(By.directive(BuludDropdown))
      .componentInstance as BuludDropdown<unknown>;
    expect(dropdown.value()).toEqual({ code: 0, name: 'Zero' });
    expect(fixture.componentInstance.form.controls.code.valid).toBe(true);
  });

  it('retains the panel layout classes supplied by remote-search consumers', async () => {
    const bridge = fixture.debugElement
      .query(By.directive(BuludDropdownData))
      .injector.get(BuludDropdownData);
    fixture.componentInstance.panelClass.set(
      'position-static w-100 border-0 mt-2',
    );
    fixture.detectChanges();
    click(fixture, '.bulud-dropdown__trigger');
    await new Promise((resolve) => setTimeout(resolve, 50));
    const panel: HTMLElement = fixture.nativeElement.querySelector(
      '.bulud-dropdown__panel',
    );
    for (const name of bridge.panelClass().split(' ')) {
      expect(panel.classList.contains(name)).toBe(true);
    }
    expect(panel.querySelector('input[type="text"]')).not.toBeNull();
  });

  it('portals the existing remote search once per open and destroys it on close', async () => {
    click(fixture, '.bulud-dropdown__trigger');
    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();
    const search = fixture.nativeElement.querySelector(
      '.bulud-dropdown__panel input',
    ) as HTMLInputElement;
    expect(search).not.toBeNull();
    search.value = 'remote';
    search.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.searches).toEqual(['remote']);
    click(fixture, '.bulud-dropdown__trigger');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fixture.nativeElement.querySelectorAll('input').length).toBe(0);
    click(fixture, '.bulud-dropdown__trigger');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(
      fixture.nativeElement.querySelectorAll('.bulud-dropdown__panel input')
        .length,
    ).toBe(1);
    fixture.destroy();
  });
  it('keeps dynamic channel inputs enabled and their required validation intact', async () => {
    const dynamic = TestBed.createComponent(DynamicHost);
    dynamic.detectChanges();
    await dynamic.whenStable();
    click(dynamic, '.bulud-dropdown__trigger');
    click(dynamic, 'input[type=checkbox]');
    expect(dynamic.componentInstance.form.controls['channels'].value).toEqual([
      'Telegram',
    ]);
    expect(dynamic.componentInstance.form.contains('addressTelegram')).toBe(
      true,
    );
    expect(dynamic.componentInstance.form.valid).toBe(false);
    const row = dynamic.nativeElement.querySelector('.bulud-dropdown__option');
    expect(row.getAttribute('aria-disabled')).not.toBe('true');
    dynamic.componentInstance.form.controls['addressTelegram'].setValue(
      'https://t.me/channel',
    );
    dynamic.detectChanges();
    expect(dynamic.componentInstance.form.valid).toBe(true);
    const address = dynamic.nativeElement.querySelector(
      '.address',
    ) as HTMLInputElement;
    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    address.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
    click(dynamic, 'input[type=checkbox]');
    expect(dynamic.componentInstance.form.contains('addressTelegram')).toBe(
      false,
    );
    expect(dynamic.componentInstance.form.controls['channels'].value).toEqual(
      [],
    );
    dynamic.destroy();
  });
});
