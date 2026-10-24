import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  effect,
  forwardRef,
  InjectionToken,
  inject,
  input,
  model,
} from '@angular/core';

/** Identifier used to associate a tab with its panel. */
export type BuludTabId = string;

/** Arrow-key axis used by the tabs keyboard interaction. */
export type BuludTabsOrientation = 'horizontal' | 'vertical';

interface BuludTabsContext {
  readonly orientation: () => BuludTabsOrientation;
  readonly isActive: (id: BuludTabId) => boolean;
  readonly tabDomId: (id: BuludTabId) => string;
  readonly panelDomId: (id: BuludTabId) => string;
  readonly select: (id: BuludTabId) => void;
  readonly handleKeydown: (event: KeyboardEvent, id: BuludTabId) => void;
}

const BULUD_TABS_CONTEXT = new InjectionToken<BuludTabsContext>(
  'BULUD_TABS_CONTEXT',
);

/**
 * Adds the tab semantics to a native button projected into {@link BuludTabs}.
 *
 * Use a unique identifier for each tab and pair it with a
 * {@link BuludTabPanel} using the same identifier.
 */
@Component({
  selector: '[buludTab]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styleUrl: './bulud-tab.scss',
  host: {
    class: 'bulud-tab',
    '[attr.role]': '"tab"',
    '[attr.id]': 'domId()',
    '[attr.aria-controls]': 'context.panelDomId(buludTab())',
    '[attr.aria-selected]': 'context.isActive(buludTab()) ? "true" : "false"',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]':
      'context.isActive(buludTab()) && !disabled() ? "0" : "-1"',
    '[attr.disabled]': 'disabled() ? "" : null',
    '(click)': 'activate()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class BuludTab {
  protected readonly context = inject(BULUD_TABS_CONTEXT);
  private readonly element = inject(ElementRef<HTMLElement>);

  /** Stable value used to associate this tab with a panel. */
  readonly buludTab = input.required<BuludTabId>();

  /** Prevents selection and removes the tab from keyboard navigation. */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly domId = computed(() =>
    this.context.tabDomId(this.buludTab()),
  );

  protected activate(): void {
    if (!this.disabled()) {
      this.context.select(this.buludTab());
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.context.handleKeydown(event, this.buludTab());
  }

  /** Focuses the native tab element after keyboard navigation. */
  focus(): void {
    this.element.nativeElement.focus();
  }
}

/**
 * Adds the panel semantics to content projected into {@link BuludTabs}.
 *
 * The panel is hidden while its matching tab is not selected and receives a
 * stable `aria-labelledby` relationship automatically.
 */
@Component({
  selector: '[buludTabPanel]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styleUrl: './bulud-tab-panel.scss',
  host: {
    class: 'bulud-tab-panel',
    '[attr.role]': '"tabpanel"',
    '[attr.id]': 'domId()',
    '[attr.aria-labelledby]': 'context.tabDomId(buludTabPanel())',
    '[hidden]': '!context.isActive(buludTabPanel())',
    '[attr.tabindex]': 'context.isActive(buludTabPanel()) ? "0" : null',
  },
})
export class BuludTabPanel {
  protected readonly context = inject(BULUD_TABS_CONTEXT);

  /** Identifier of the tab whose content this panel contains. */
  readonly buludTabPanel = input.required<BuludTabId>();

  protected readonly domId = computed(() =>
    this.context.panelDomId(this.buludTabPanel()),
  );
}

/**
 * A composable, accessible tabs container.
 *
 * Project native buttons with `buludTab` and matching panels with
 * `buludTabPanel` into the component. Selection is automatic: the first
 * enabled tab is selected unless `activeId` names another enabled tab.
 */
@Component({
  selector: 'bulud-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: BULUD_TABS_CONTEXT,
      useExisting: forwardRef(() => BuludTabs),
    },
  ],
  host: {
    class: 'bulud-tabs-host',
    '[class.bulud-tabs-host--vertical]': 'orientation() === "vertical"',
  },
  templateUrl: './bulud-tabs.html',
  styleUrl: './bulud-tabs.scss',
})
export class BuludTabs implements BuludTabsContext {
  private static nextId = 0;
  private readonly instanceId = `bulud-tabs-${BuludTabs.nextId++}`;
  private readonly tabItems = contentChildren(BuludTab);

  /** Currently selected tab identifier. Supports `[(activeId)]`. */
  readonly activeId = model<BuludTabId | null>(null);

  /** Orientation used for layout and arrow-key navigation. */
  readonly orientation = input<BuludTabsOrientation>('horizontal');

  /** Accessible name for the tablist when surrounding context is insufficient. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  protected readonly selectedId = computed<BuludTabId | null>(() => {
    const tabs = this.tabItems();
    const requested = this.activeId();
    const requestedTab = tabs.find((tab) => tab.buludTab() === requested);

    if (requestedTab && !requestedTab.disabled()) {
      return requested;
    }

    return tabs.find((tab) => !tab.disabled())?.buludTab() ?? null;
  });

  constructor() {
    // Keep the public model aligned with the effective selection when tabs
    // are added, removed, disabled, or when an invalid id is supplied.
    const selectedId = this.selectedId;
    effect(() => {
      const nextId = selectedId();
      if (this.activeId() !== nextId) {
        this.activeId.set(nextId);
      }
    });
  }

  isActive(id: BuludTabId): boolean {
    return this.selectedId() === id;
  }

  tabDomId(id: BuludTabId): string {
    return `${this.instanceId}-tab-${this.toDomSegment(id)}`;
  }

  panelDomId(id: BuludTabId): string {
    return `${this.instanceId}-panel-${this.toDomSegment(id)}`;
  }

  select(id: BuludTabId): void {
    const tab = this.tabItems().find((item) => item.buludTab() === id);
    if (tab && !tab.disabled()) {
      this.activeId.set(id);
    }
  }

  handleKeydown(event: KeyboardEvent, id: BuludTabId): void {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const tabs = this.tabItems();
    const enabledTabs = tabs.filter((tab) => !tab.disabled());
    const currentIndex = enabledTabs.findIndex((tab) => tab.buludTab() === id);
    if (currentIndex < 0) {
      return;
    }

    let targetIndex: number | null = null;
    const previousKey =
      this.orientation() === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const nextKey =
      this.orientation() === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

    if (event.key === previousKey) {
      targetIndex =
        (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    } else if (event.key === nextKey) {
      targetIndex = (currentIndex + 1) % enabledTabs.length;
    } else if (event.key === 'Home') {
      targetIndex = 0;
    } else if (event.key === 'End') {
      targetIndex = enabledTabs.length - 1;
    }

    if (targetIndex === null) {
      return;
    }

    event.preventDefault();
    const target = enabledTabs[targetIndex];
    this.select(target.buludTab());
    target.focus();
  }

  private toDomSegment(id: BuludTabId): string {
    const codePoints = Array.from(id).map((character) =>
      (character.codePointAt(0) ?? 0).toString(16).padStart(4, '0'),
    );
    return codePoints.length > 0 ? `u-${codePoints.join('-')}` : 'empty';
  }
}
