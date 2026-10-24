import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BULUD_SHARED_UI_CONFIG } from 'bulud-ng';
import { BuludTable, BuludTableCell, BuludTableDetail } from './table';
@Component({
  imports: [BuludTable, BuludTableCell, BuludTableDetail],
  template: `<bulud-table
    [rows]="rows"
    [columns]="columns"
    [rowKey]="key"
    caption="Records"
    ><ng-template buludTableCell="name" let-row
      >Custom {{ row.name }}</ng-template
    ><ng-template buludTableDetail let-row
      >Detail {{ row.name }}</ng-template
    ></bulud-table
  >`,
})
class ProjectionHost {
  rows = [{ id: 1, name: 'One' }];
  columns = [
    { key: 'name', heading: 'Name', value: (r: { name: string }) => r.name },
  ];
  key = (r: { id: number }) => r.id;
}
describe('BuludTable', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  async function setup() {
    const f = TestBed.createComponent(BuludTable<{ id: number }>);
    f.componentRef.setInput('rows', [{ id: 3 }, { id: 1 }, { id: 2 }]);
    f.componentRef.setInput('columns', [
      {
        key: 'id',
        heading: 'ID',
        value: (r: { id: number }) => r.id,
        sortable: true,
        compare: (a: { id: number }, b: { id: number }) => a.id - b.id,
      },
    ]);
    f.componentRef.setInput('rowKey', (r: { id: number }) => r.id);
    f.componentRef.setInput('caption', 'Records');
    await f.whenStable();
    return f;
  }
  it('sorts both directions without mutating consumer rows and resets page', async () => {
    const f = await setup();
    const original = f.componentInstance.rows();
    const changed = spyOn(f.componentInstance.stateChange, 'emit');
    (f.nativeElement.querySelector('th button') as HTMLButtonElement).click();
    await f.whenStable();
    expect(f.nativeElement.querySelector('tbody td').textContent.trim()).toBe(
      '1',
    );
    expect(f.nativeElement.querySelector('th').getAttribute('aria-sort')).toBe(
      'ascending',
    );
    (f.nativeElement.querySelector('th button') as HTMLButtonElement).click();
    await f.whenStable();
    expect(f.nativeElement.querySelector('tbody td').textContent.trim()).toBe(
      '3',
    );
    expect(original.map((r) => r.id)).toEqual([3, 1, 2]);
    expect(changed).toHaveBeenCalledTimes(2);
  });
  it('paginates locally, clamps stale page and guards invalid page size', async () => {
    const f = await setup();
    f.componentRef.setInput('pageSize', 2);
    f.componentRef.setInput('page', 500);
    await f.whenStable();
    expect(f.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    expect(f.nativeElement.querySelector('tbody td').textContent.trim()).toBe(
      '2',
    );
    f.componentRef.setInput('pageSize', NaN);
    await f.whenStable();
    expect(f.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
  });
  it('server mode preserves the received page and emits sort requests', async () => {
    const f = await setup();
    f.componentRef.setInput('server', true);
    f.componentRef.setInput('total', 20);
    f.componentRef.setInput('pageSize', 2);
    f.componentRef.setInput('page', 3);
    await f.whenStable();
    expect(f.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
    (f.nativeElement.querySelector('th button') as HTMLButtonElement).click();
    await f.whenStable();
    expect(f.nativeElement.querySelector('tbody td').textContent.trim()).toBe(
      '3',
    );
    expect(f.componentInstance.page()).toBe(1);
  });
  it('renders loading/error/empty statuses and prevents disabled sorting', async () => {
    const f = await setup();
    f.componentRef.setInput('loading', true);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role=status]').textContent,
    ).toContain('Loading');
    expect(f.nativeElement.querySelector('th button').disabled).toBeTrue();
    f.componentRef.setInput('loading', false);
    f.componentRef.setInput('error', true);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Unable');
    f.componentRef.setInput('error', false);
    f.componentRef.setInput('rows', []);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('No records');
  });
  it('projects custom cells and details with real button expansion', async () => {
    const f = TestBed.createComponent(ProjectionHost);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Custom One');
    const button = f.nativeElement.querySelector(
      'tbody button',
    ) as HTMLButtonElement;
    button.click();
    await f.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(f.nativeElement.textContent).toContain('Detail One');
    button.click();
    await f.whenStable();
    expect(f.nativeElement.textContent).not.toContain('Detail One');
  });
  it('resolves theme instance > component default > global config > CSS fallback', async () => {
    TestBed.overrideProvider(BULUD_SHARED_UI_CONFIG, {
      useValue: {
        theme: { border: 'red', foreground: 'blue' },
        components: { table: { border: 'green' } },
      },
    });
    const f = await setup();
    expect(f.nativeElement.style.getPropertyValue('--bulud-table-border')).toBe(
      'green',
    );
    expect(
      f.nativeElement.style.getPropertyValue('--bulud-table-foreground'),
    ).toBe('blue');
    expect(
      f.nativeElement.style.getPropertyValue('--bulud-table-padding'),
    ).toBe('');
    f.componentRef.setInput('theme', { border: 'purple' });
    await f.whenStable();
    expect(f.nativeElement.style.getPropertyValue('--bulud-table-border')).toBe(
      'purple',
    );
    f.componentRef.setInput('theme', undefined);
    await f.whenStable();
    expect(f.nativeElement.style.getPropertyValue('--bulud-table-border')).toBe(
      'green',
    );
  });
  it('filters local pages and emits server filter requests without slicing the received page', async () => {
    const f = await setup();
    f.componentRef.setInput('filterDefinitions', [
      { key: 'id', label: 'Minimum ID', kind: 'number', operator: 'gte' },
    ]);
    f.componentRef.setInput('page', 2);
    f.componentRef.setInput('pageSize', 2);
    await f.whenStable();
    const changed = spyOn(f.componentInstance.stateChange, 'emit');
    const input = f.nativeElement.querySelector(
      'bulud-table-filters input',
    ) as HTMLInputElement;
    input.value = '2';
    input.dispatchEvent(new Event('input'));
    await f.whenStable();
    expect(f.componentInstance.page()).toBe(1);
    expect(f.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    expect(changed).toHaveBeenCalledWith({
      page: 1,
      sort: null,
      filters: { id: '2' },
    });
    f.componentRef.setInput('server', true);
    await f.whenStable();
    expect(f.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
  });
});
