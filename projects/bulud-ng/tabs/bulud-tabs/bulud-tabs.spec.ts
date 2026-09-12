import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BuludTab,
  BuludTabPanel,
  BuludTabs,
  BuludTabsOrientation,
} from './bulud-tabs';

@Component({
  imports: [BuludTabs, BuludTab, BuludTabPanel],
  template: `
    <bulud-tabs
      [activeId]="activeId()"
      (activeIdChange)="activeId.set($event)"
      [orientation]="orientation()"
    >
      <button type="button" [buludTab]="'overview'">Overview</button>
      <button type="button" [buludTab]="'details'">Details</button>
      <button type="button" [buludTab]="'disabled'" disabled>Disabled</button>

      <section [buludTabPanel]="'overview'">Overview content</section>
      <section [buludTabPanel]="'details'">Details content</section>
      <section [buludTabPanel]="'disabled'">Disabled content</section>
    </bulud-tabs>
  `,
})
class TestHost {
  readonly activeId = signal<string | null>(null);
  readonly orientation = signal<BuludTabsOrientation>('horizontal');
}

@Component({
  imports: [BuludTabs, BuludTab, BuludTabPanel],
  template: `
    <bulud-tabs
      [activeId]="outerActive()"
      (activeIdChange)="outerActive.set($event)"
    >
      <button type="button" [buludTab]="'outer-one'">Outer one</button>
      <button type="button" [buludTab]="'outer-two'">Outer two</button>

      <section [buludTabPanel]="'outer-one'">
        <bulud-tabs
          [activeId]="innerActive()"
          (activeIdChange)="innerActive.set($event)"
        >
          <button type="button" [buludTab]="'inner-one'">Inner one</button>
          <button type="button" [buludTab]="'inner-two'">Inner two</button>

          <section [buludTabPanel]="'inner-one'">Inner one content</section>
          <section [buludTabPanel]="'inner-two'">Inner two content</section>
        </bulud-tabs>
      </section>
      <section [buludTabPanel]="'outer-two'">Outer two content</section>
    </bulud-tabs>
  `,
})
class NestedTabsHost {
  readonly outerActive = signal<string | null>('outer-two');
  readonly innerActive = signal<string | null>(null);
}

@Component({
  imports: [BuludTabs, BuludTab, BuludTabPanel],
  template: `
    <bulud-tabs>
      <button type="button" [buludTab]="'team/a'">Slash</button>
      <button type="button" [buludTab]="'team-a'">Dash</button>
      <button type="button" [buludTab]="''">Empty</button>
      <button type="button" [buludTab]="'  '">Whitespace</button>

      <section [buludTabPanel]="'team/a'">Slash content</section>
      <section [buludTabPanel]="'team-a'">Dash content</section>
      <section [buludTabPanel]="''">Empty content</section>
      <section [buludTabPanel]="'  '">Whitespace content</section>
    </bulud-tabs>
  `,
})
class CollisionTabsHost {}

describe('BuludTabs', () => {
  let fixture: ComponentFixture<TestHost>;

  const getTabs = (): HTMLButtonElement[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll('[role="tab"]'),
    ) as HTMLButtonElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost, NestedTabsHost, CollisionTabsHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  it('renders tablist semantics, stable relationships, and the first enabled tab', () => {
    const tabs = getTabs();
    const panels = Array.from(
      fixture.nativeElement.querySelectorAll('[role="tabpanel"]'),
    ) as HTMLElement[];

    expect(
      fixture.nativeElement.querySelector('[role="tablist"]'),
    ).not.toBeNull();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('tabindex')).toBe('0');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[2].getAttribute('aria-disabled')).toBe('true');
    expect(tabs[0].getAttribute('aria-controls')).toBe(panels[0].id);
    expect(panels[0].getAttribute('aria-labelledby')).toBe(tabs[0].id);
    expect(panels[0].hidden).toBeFalse();
    expect(panels[1].hidden).toBeTrue();
  });

  it('supports controlled selection and emits user selection', () => {
    const tabs = getTabs();

    tabs[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeId()).toBe('details');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(
      (
        fixture.nativeElement.querySelectorAll(
          '[role="tabpanel"]',
        )[1] as HTMLElement
      ).hidden,
    ).toBeFalse();

    fixture.componentInstance.activeId.set('overview');
    fixture.detectChanges();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('skips disabled tabs and supports horizontal APG keys', () => {
    const tabs = getTabs();

    tabs[0].focus();
    tabs[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[1]);
    expect(fixture.componentInstance.activeId()).toBe('details');

    tabs[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[0]);

    tabs[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('uses vertical arrow keys when configured', () => {
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    const tabs = getTabs();
    expect(
      fixture.nativeElement
        .querySelector('[role="tablist"]')
        .getAttribute('aria-orientation'),
    ).toBe('vertical');

    tabs[0].focus();
    tabs[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[1]);

    tabs[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('does not select a disabled tab by pointer or keyboard', () => {
    const tabs = getTabs();

    tabs[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeId()).toBe('overview');
    expect(tabs[2].disabled).toBeTrue();
    expect(tabs[2].getAttribute('tabindex')).toBe('-1');
  });

  it('does not include nested tabs in the owning tablist navigation', () => {
    const nestedFixture = TestBed.createComponent(NestedTabsHost);
    nestedFixture.detectChanges();

    const tablists =
      nestedFixture.nativeElement.querySelectorAll('[role="tablist"]');
    const outerTabs = Array.from(
      tablists[0].querySelectorAll('[role="tab"]'),
    ) as HTMLButtonElement[];

    expect(outerTabs.length).toBe(2);
    expect(tablists[1].querySelectorAll('[role="tab"]').length).toBe(2);

    outerTabs[1].focus();
    outerTabs[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    nestedFixture.detectChanges();

    expect(nestedFixture.componentInstance.outerActive()).toBe('outer-one');
    expect(nestedFixture.componentInstance.innerActive()).toBe('inner-one');
    expect(document.activeElement).toBe(outerTabs[0]);
  });

  it('generates unique DOM relationships for normalized and empty identifiers', () => {
    const collisionFixture = TestBed.createComponent(CollisionTabsHost);
    collisionFixture.detectChanges();

    const tabs = Array.from(
      collisionFixture.nativeElement.querySelectorAll('[role="tab"]'),
    ) as HTMLButtonElement[];
    const panels = Array.from(
      collisionFixture.nativeElement.querySelectorAll('[role="tabpanel"]'),
    ) as HTMLElement[];
    const tabIds = tabs.map((tab) => tab.id);
    const panelIds = panels.map((panel) => panel.id);

    expect(new Set(tabIds).size).toBe(tabIds.length);
    expect(new Set(panelIds).size).toBe(panelIds.length);
    tabs.forEach((tab, index) => {
      expect(tab.getAttribute('aria-controls')).toBe(panelIds[index]);
      expect(panels[index].getAttribute('aria-labelledby')).toBe(tabIds[index]);
    });
  });
});
