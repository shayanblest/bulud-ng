import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuludAccordion, BuludAccordionItem } from './bulud-accordion';

@Component({
  imports: [BuludAccordion, BuludAccordionItem],
  template: `
    <bulud-accordion
      [multiple]="multiple()"
      [expanded]="expanded()"
      (expandedChange)="expanded.set($event)"
    >
      <section [buludAccordionItem]="'overview'">
        <span buludAccordionTrigger>Overview</span>
        <div buludAccordionPanel>
          Overview content
          <button type="button" class="panel-action">Panel action</button>
        </div>
      </section>
      <section [buludAccordionItem]="'details'">
        <span buludAccordionTrigger>Details</span>
        <p buludAccordionPanel>Details content</p>
      </section>
      <section [buludAccordionItem]="'disabled'" disabled>
        <span buludAccordionTrigger>Disabled</span>
        <p buludAccordionPanel>Disabled content</p>
      </section>
    </bulud-accordion>
  `,
})
class TestHost {
  readonly multiple = signal(false);
  readonly expanded = signal<string | readonly string[] | null>(null);
}

@Component({
  imports: [BuludAccordion, BuludAccordionItem],
  template: `
    <bulud-accordion multiple>
      @if (showFirst()) {
        <section [buludAccordionItem]="'first'">
          <span buludAccordionTrigger>First</span>
          <p buludAccordionPanel>First content</p>
        </section>
      }
      <section [buludAccordionItem]="'second'">
        <span buludAccordionTrigger>Second</span>
        <p buludAccordionPanel>Second content</p>
      </section>
    </bulud-accordion>
  `,
})
class DynamicHost {
  readonly showFirst = signal(true);
}

describe('BuludAccordion', () => {
  let fixture: ComponentFixture<TestHost>;

  const getTriggers = (): HTMLButtonElement[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll('.bulud-accordion-item__trigger'),
    ) as HTMLButtonElement[];

  const getPanels = (): HTMLElement[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll('[role="region"]'),
    ) as HTMLElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost, DynamicHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  it('renders heading, button, panel semantics, stable relationships, and collapsed panels', () => {
    const triggers = getTriggers();
    const panels = getPanels();

    expect(fixture.nativeElement.querySelectorAll('h3')).toHaveSize(3);
    expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
    expect(triggers[0].getAttribute('aria-controls')).toBe(panels[0].id);
    expect(panels[0].getAttribute('aria-labelledby')).toBe(triggers[0].id);
    expect(panels[0].hidden).toBeTrue();
    expect(panels[0].getAttribute('aria-hidden')).toBe('true');
    expect(new Set(triggers.map((trigger) => trigger.id)).size).toBe(3);
    expect(new Set(panels.map((panel) => panel.id)).size).toBe(3);
  });

  it('supports controlled single expansion and collapsible toggling', () => {
    const triggers = getTriggers();

    triggers[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded()).toBe('overview');
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    expect(getPanels()[0].hidden).toBeFalse();

    triggers[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded()).toBe('details');
    expect(getPanels()[0].hidden).toBeTrue();
    expect(getPanels()[1].hidden).toBeFalse();

    triggers[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded()).toBeNull();
  });

  it('supports multiple expansion and controlled model updates', () => {
    fixture.componentInstance.multiple.set(true);
    fixture.componentInstance.expanded.set(['overview']);
    fixture.detectChanges();

    const triggers = getTriggers();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    triggers[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded()).toEqual([
      'overview',
      'details',
    ]);

    fixture.componentInstance.expanded.set(['details']);
    fixture.detectChanges();
    expect(getPanels()[0].hidden).toBeTrue();
    expect(getPanels()[1].hidden).toBeFalse();
  });

  it('does not toggle disabled items and skips them during keyboard navigation', () => {
    const triggers = getTriggers();

    expect(triggers[2].disabled).toBeTrue();
    expect(triggers[2].getAttribute('aria-disabled')).toBe('true');
    triggers[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded()).toBeNull();

    triggers[0].focus();
    triggers[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(triggers[1]);

    triggers[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(triggers[0]);
  });

  it('returns focus to the trigger before collapsing a panel containing focus', () => {
    const triggers = getTriggers();
    triggers[0].click();
    fixture.detectChanges();

    const action = fixture.nativeElement.querySelector(
      '.panel-action',
    ) as HTMLButtonElement;
    action.focus();
    triggers[0].click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(triggers[0]);
    expect(getPanels()[0].hidden).toBeTrue();
  });

  it('returns focus when controlled state collapses the active panel', async () => {
    const triggers = getTriggers();
    triggers[0].click();
    fixture.detectChanges();

    const action = fixture.nativeElement.querySelector(
      '.panel-action',
    ) as HTMLButtonElement;
    action.focus();
    fixture.componentInstance.expanded.set(null);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(triggers[0]);
  });

  it('prunes expansion for projected items removed at runtime', () => {
    const dynamicFixture = TestBed.createComponent(DynamicHost);
    dynamicFixture.detectChanges();

    const accordion = dynamicFixture.nativeElement.querySelector(
      'bulud-accordion',
    ) as HTMLElement;
    const firstTrigger = accordion.querySelector(
      '.bulud-accordion-item__trigger',
    ) as HTMLButtonElement;
    firstTrigger.click();
    dynamicFixture.detectChanges();

    dynamicFixture.componentInstance.showFirst.set(false);
    dynamicFixture.detectChanges();

    expect(accordion.querySelectorAll('[role="region"]')).toHaveSize(1);
    expect(
      accordion
        .querySelector('.bulud-accordion-item__trigger')
        ?.getAttribute('aria-expanded'),
    ).toBe('false');
  });
});
