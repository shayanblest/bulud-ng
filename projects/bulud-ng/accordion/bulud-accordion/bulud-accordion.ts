import {
  booleanAttribute,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DOCUMENT,
  ElementRef,
  effect,
  forwardRef,
  inject,
  InjectionToken,
  input,
  model,
  viewChild,
} from '@angular/core';

/** Identifier used to associate an accordion item with its expansion state. */
export type BuludAccordionId = string;

/** Expansion mode used by {@link BuludAccordion}. */
export type BuludAccordionMode = 'single' | 'multiple';

interface BuludAccordionContext {
  readonly isExpanded: (id: BuludAccordionId) => boolean;
  readonly toggle: (id: BuludAccordionId) => void;
  readonly itemDomId: (id: BuludAccordionId) => string;
  readonly panelDomId: (id: BuludAccordionId) => string;
  readonly focusRelative: (id: BuludAccordionId, delta: number) => void;
  readonly focusEdge: (id: BuludAccordionId, end: boolean) => void;
}

const BULUD_ACCORDION_CONTEXT = new InjectionToken<BuludAccordionContext>(
  'BULUD_ACCORDION_CONTEXT',
);

/**
 * Adds an accessible accordion item to {@link BuludAccordion}.
 *
 * Project an element marked with `buludAccordionTrigger` and another marked
 * with `buludAccordionPanel`. The trigger is rendered inside a heading and a
 * native button is supplied by the component.
 */
@Component({
  selector: '[buludAccordionItem]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bulud-accordion-item.html',
  styleUrl: './bulud-accordion-item.scss',
  host: {
    class: 'bulud-accordion-item-host',
    '[class.bulud-accordion-item-host--expanded]': 'isExpanded()',
    '[class.bulud-accordion-item-host--disabled]': 'disabled()',
  },
})
export class BuludAccordionItem {
  protected readonly context = inject(BULUD_ACCORDION_CONTEXT);
  private readonly document = inject(DOCUMENT);
  private readonly trigger =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** Stable identifier used by the accordion's controlled model. */
  readonly buludAccordionItem = input.required<BuludAccordionId>();

  /** Prevents this item from being toggled or keyboard-focused. */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly isExpanded = computed(() =>
    this.context.isExpanded(this.buludAccordionItem()),
  );

  protected readonly triggerDomId = computed(() =>
    this.context.itemDomId(this.buludAccordionItem()),
  );

  protected readonly panelDomId = computed(() =>
    this.context.panelDomId(this.buludAccordionItem()),
  );

  constructor() {
    // A controlled parent can collapse an item without going through this
    // item's click handler. Move focus before the hidden panel leaves the
    // usable focus order in that case as well.
    afterRenderEffect(() => {
      if (this.isExpanded()) {
        return;
      }

      const panel = this.panel()?.nativeElement;
      if (panel?.contains(this.document.activeElement)) {
        this.focus();
      }
    });
  }

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }

    this.focusTriggerIfPanelContainsFocus();
    this.context.toggle(this.buludAccordionItem());
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || this.disabled()) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.context.focusRelative(this.buludAccordionItem(), 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.context.focusRelative(this.buludAccordionItem(), -1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.context.focusEdge(this.buludAccordionItem(), false);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.context.focusEdge(this.buludAccordionItem(), true);
    }
  }

  /** Focuses the item's heading button for roving keyboard navigation. */
  focus(): void {
    this.trigger()?.nativeElement.focus();
  }

  private focusTriggerIfPanelContainsFocus(): void {
    const panel = this.panel()?.nativeElement;
    const activeElement = this.document.activeElement;

    if (this.isExpanded() && panel?.contains(activeElement)) {
      this.focus();
    }
  }
}

/**
 * A composable, accessible accordion with controlled single or multiple
 * expansion.
 *
 * Use `[(expanded)]` with a string or `null` in single mode and a readonly
 * string array in multiple mode. Item identifiers must be unique within one
 * accordion.
 */
@Component({
  selector: 'bulud-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: BULUD_ACCORDION_CONTEXT,
      useExisting: forwardRef(() => BuludAccordion),
    },
  ],
  templateUrl: './bulud-accordion.html',
  styleUrl: './bulud-accordion.scss',
  host: {
    class: 'bulud-accordion-host',
    '[class.bulud-accordion-host--multiple]': 'multiple()',
  },
})
export class BuludAccordion implements BuludAccordionContext {
  private static nextId = 0;
  private readonly instanceId = `bulud-accordion-${BuludAccordion.nextId++}`;
  private readonly items = contentChildren(BuludAccordionItem);
  private hasProjectedItems = false;

  /** Allows several items to remain expanded at the same time. */
  readonly multiple = input(false, { transform: booleanAttribute });

  /** Allows the active item in single mode to be collapsed. */
  readonly collapsible = input(true, { transform: booleanAttribute });

  /** Expanded item identifier, or identifiers when `multiple` is enabled. */
  readonly expanded = model<
    BuludAccordionId | readonly BuludAccordionId[] | null
  >(null);

  private readonly expandedIds = computed<readonly BuludAccordionId[]>(() => {
    const value = this.expanded();

    if (this.multiple()) {
      return Array.isArray(value) ? value : value === null ? [] : [value];
    }

    return value === null || Array.isArray(value) ? [] : [value];
  });

  private readonly itemIds = computed(() =>
    this.items()
      .map((item) => this.readItemId(item))
      .filter((id): id is BuludAccordionId => id !== undefined),
  );

  private readonly effectiveExpandedIds = computed(() => {
    const available = new Set(this.itemIds());
    return this.expandedIds().filter((id) => available.has(id));
  });

  constructor() {
    // Keep externally controlled state valid as projected items are added or
    // removed, while preserving a value supplied before the first projection
    // render.
    effect(() => {
      const itemIds = this.itemIds();
      if (itemIds.length === 0 && !this.hasProjectedItems) {
        return;
      }
      this.hasProjectedItems = true;

      const validIds = this.effectiveExpandedIds();
      const nextValue = this.multiple() ? validIds : (validIds[0] ?? null);
      const currentValue = this.expanded();
      const isSame = Array.isArray(nextValue)
        ? Array.isArray(currentValue) &&
          currentValue.length === nextValue.length &&
          currentValue.every((id, index) => id === nextValue[index])
        : currentValue === nextValue;

      if (!isSame) {
        this.expanded.set(nextValue);
      }
    });
  }

  isExpanded(id: BuludAccordionId): boolean {
    return this.effectiveExpandedIds().includes(id);
  }

  itemDomId(id: BuludAccordionId): string {
    return `${this.instanceId}-item-${this.toDomSegment(id)}`;
  }

  panelDomId(id: BuludAccordionId): string {
    return `${this.instanceId}-panel-${this.toDomSegment(id)}`;
  }

  toggle(id: BuludAccordionId): void {
    if (this.multiple()) {
      const current = this.expandedIds();
      const next = current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id];
      this.expanded.set(next);
      return;
    }

    this.expanded.set(this.isExpanded(id) && this.collapsible() ? null : id);
  }

  focusRelative(id: BuludAccordionId, delta: number): void {
    const enabledItems = this.items().filter((item) => !item.disabled());
    const currentIndex = enabledItems.findIndex(
      (item) => this.readItemId(item) === id,
    );

    if (currentIndex < 0 || enabledItems.length < 2) {
      return;
    }

    const nextIndex =
      (currentIndex + delta + enabledItems.length) % enabledItems.length;
    enabledItems[nextIndex].focus();
  }

  focusEdge(id: BuludAccordionId, end: boolean): void {
    const enabledItems = this.items().filter((item) => !item.disabled());
    if (
      enabledItems.length === 0 ||
      !enabledItems.some((item) => this.readItemId(item) === id)
    ) {
      return;
    }

    enabledItems[end ? enabledItems.length - 1 : 0].focus();
  }

  private readItemId(item: BuludAccordionItem): BuludAccordionId | undefined {
    try {
      return item.buludAccordionItem();
    } catch {
      // A dynamically inserted item can be queried before Angular assigns its
      // required input. Ignore that transient state until the next render.
      return undefined;
    }
  }

  private toDomSegment(id: BuludAccordionId): string {
    const codePoints = Array.from(id).map((character) =>
      (character.codePointAt(0) ?? 0).toString(16).padStart(4, '0'),
    );
    return codePoints.length > 0 ? `u-${codePoints.join('-')}` : 'empty';
  }
}
