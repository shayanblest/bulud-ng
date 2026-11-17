import {
  Component,
  provideZonelessChangeDetection,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BULUD_SHARED_UI_CONFIG } from 'bulud-ng';
import {
  BuludTabPanel,
  BuludTabs,
  BuludTabHeading,
} from './bulud-tabs/bulud-tabs';
@Component({
  imports: [BuludTabPanel, BuludTabs, BuludTabHeading],
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- Mutable consumer fixture retained by the official Angular 22 migration.
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<bulud-tabs presentation="projected"
    aria-label="Account sections"
    [activeId]="selection()"
    (tabChange)="events.push($event)"
    ><section buludTabPanel="Overview"
      ><ng-template buludTabHeading>Overview</ng-template
      ><strong>Overview content</strong></section>
    @if (allowed()) {
      <section buludTabPanel="History"
        ><ng-template buludTabHeading>History</ng-template
        ><strong>History content</strong></section>
    }
  </bulud-tabs>`,
})
class Host {
  readonly selection = signal<string | undefined>(undefined);
  readonly allowed = signal(true);
  readonly events: string[] = [];
  readonly tabs = viewChild.required(BuludTabs);
}
describe('BuludTabs compatibility and accessible interaction', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_SHARED_UI_CONFIG,
          useValue: {
            theme: { gap: '3px' },
            components: { 'tabs': { gap: '7px' } },
          },
        },
      ],
    }),
  );
  it('retains missing and permission-hidden selection without normalizing or emitting initialization', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=tabpanel]')).toBeNull();
    f.componentInstance.selection.set('History');
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role=tabpanel]').textContent,
    ).toContain('History content');
    f.componentInstance.allowed.set(false);
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=tabpanel]')).toBeNull();
    expect(f.componentInstance.tabs().activeId()).toBe('History');
    expect(f.componentInstance.events).toEqual([]);
  });
  it('matches panel names case-insensitively while keeping the existing exact header highlight contract', async () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.selection.set('overview');
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role=tabpanel]').textContent,
    ).toContain('Overview content');
    expect(f.nativeElement.querySelector('.active')).toBeNull();
  });
  it('emits repeated activation and connects semantic tabs/panels with keyboard focus', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const tabs = Array.from(
      f.nativeElement.querySelectorAll('[role=tab]'),
    ) as HTMLElement[];
    tabs[0].click();
    await f.whenStable();
    tabs[0].click();
    await f.whenStable();
    expect(f.componentInstance.events).toEqual(['Overview', 'Overview']);
    const panel = f.nativeElement.querySelector('[role=tabpanel]');
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0].id);
    expect(tabs[0].getAttribute('aria-controls')).toBe(panel.id);
    tabs[0].focus();
    tabs[0].dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(tabs[1]);
    tabs[1].dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    );
    await f.whenStable();
    expect(f.componentInstance.events).toEqual([
      'Overview',
      'Overview',
      'History',
    ]);
  });
  it('uses global then component-default then instance theme without freezing CSS fallback', async () => {
    const f = TestBed.createComponent(BuludTabs);
    f.componentRef.setInput('aria-label', 'Tabs');
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.style.getPropertyValue('--bulud-tabs-gap')).toBe('7px');
    f.componentRef.setInput('theme', { gap: '11px' });
    await f.whenStable();
    expect(el.style.getPropertyValue('--bulud-tabs-gap')).toBe(
      '11px',
    );
    f.componentRef.setInput('theme', undefined);
    await f.whenStable();
    expect(el.style.getPropertyValue('--bulud-tabs-gap')).toBe('7px');
  });
});
