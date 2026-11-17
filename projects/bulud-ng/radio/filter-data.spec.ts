import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludRadio, BuludRadioGroup } from 'bulud-ng/radio';
import { BuludFilterData } from './filter-data';
@Component({
  imports: [BuludRadio, BuludRadioGroup, BuludFilterData],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<bulud-radio-group
    buludFilterData
    [activeItem]="active()"
    (itemChange)="events.push($event)"
    ><bulud-radio value="__bulud_all__">All</bulud-radio>
    @for (item of items(); track item) {
      <bulud-radio [value]="item" [disabled]="item === disabled()">{{
        item
      }}</bulud-radio>
    }
  </bulud-radio-group>`,
})
class Host {
  readonly active = signal<string | undefined>('OPEN');
  readonly items = signal(['OPEN', 'CLOSED']);
  readonly disabled = signal('CLOSED');
  readonly events: (string | undefined)[] = [];
}
describe('BuludFilterData scalar list filtering', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  async function setup() {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    return {
      f,
      host: f.componentInstance,
      input: (index: number) =>
        f.nativeElement.querySelectorAll('input')[index] as HTMLInputElement,
    };
  }
  it('initializes without a request and emits undefined once for the all-items option', async () => {
    const { f, host, input } = await setup();
    expect(input(1).checked).toBeTrue();
    expect(host.events).toEqual([]);
    input(0).click();
    await f.whenStable();
    expect(host.events).toEqual([undefined]);
  });
  it('retains repeat clicks without double-emitting label activation and ignores disabled options', async () => {
    const { f, host, input } = await setup();
    const label = f.nativeElement.querySelectorAll('label')[1];
    label.click();
    await f.whenStable();
    label.click();
    await f.whenStable();
    expect(host.events).toEqual(['OPEN', 'OPEN']);
    input(2).click();
    await f.whenStable();
    expect(host.events).toEqual(['OPEN', 'OPEN']);
  });
  it('retains missing selection and reacts to option/input updates without emitting requests', async () => {
    const { f, host, input } = await setup();
    host.active.set('MISSING');
    await f.whenStable();
    expect([input(0), input(1), input(2)].some((el) => el.checked)).toBeFalse();
    host.items.set(['OTHER', 'OPEN']);
    host.active.set(undefined);
    await f.whenStable();
    expect(input(0).checked).toBeTrue();
    host.active.set('OTHER');
    await f.whenStable();
    expect(input(1).checked).toBeTrue();
    expect(host.events).toEqual([]);
  });
  it('emits native change events once for keyboard selection', async () => {
    const { f, host, input } = await setup();
    host.disabled.set('');
    await f.whenStable();
    input(2).checked = true;
    input(2).dispatchEvent(new Event('change', { bubbles: true }));
    await f.whenStable();
    expect(host.events).toEqual(['CLOSED']);
  });
});
