import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BuludButton } from 'bulud-ng/button';
import { BuludBadge } from 'bulud-ng/badge';
import { BuludTabs, BuludTab, BuludTabPanel } from 'bulud-ng/tabs';
import { BuludAccordion, BuludAccordionItem } from 'bulud-ng/accordion';
import { BuludDialog } from 'bulud-ng/dialog';
import { BuludPagination } from 'bulud-ng/pagination';
import { BuludTextareaAutosize } from 'bulud-ng/textarea-autosize';
import { BuludTextarea } from 'bulud-ng/textarea';
import { BuludResizeObserver } from 'bulud-ng/resize-observer';
import { BuludClickOutside } from 'bulud-ng/clickoutside';
import {
  BuludPersianDigitsPipe,
  BuludEnglishDigitsPipe,
} from 'bulud-ng/digits';
import { BuludInitialsPipe } from 'bulud-ng/initials';
import { BuludFileSizePipe } from 'bulud-ng/filesize';
@Component({
  selector: 'base-primitives',
  imports: [
    BuludButton,
    BuludBadge,
    BuludTabs,
    BuludTab,
    BuludTabPanel,
    BuludAccordion,
    BuludAccordionItem,
    BuludDialog,
    BuludPagination,
    BuludTextareaAutosize,
    BuludTextarea,
    BuludResizeObserver,
    BuludClickOutside,
    BuludPersianDigitsPipe,
    BuludEnglishDigitsPipe,
    BuludInitialsPipe,
    BuludFileSizePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="surface">
    <div class="toolbar">
      <bulud-button (click)="open.set(true)">Open dialog</bulud-button
      ><bulud-button variant="secondary">Secondary</bulud-button
      ><bulud-button variant="ghost">Ghost</bulud-button
      ><bulud-button disabled>Disabled</bulud-button
      ><bulud-badge>Badge</bulud-badge>
    </div>
    <bulud-tabs aria-label="Demo tabs" [(activeId)]="tab"
      ><button buludTab="first">First</button
      ><button buludTab="second">Second</button>
      <div buludTabPanel="first">First panel</div>
      <div buludTabPanel="second">Second panel</div></bulud-tabs
    >
    <bulud-accordion
      ><section buludAccordionItem="example">
        <span buludAccordionTrigger>Accordion</span>
        <p buludAccordionPanel>Keyboard accessible expandable content</p>
      </section></bulud-accordion
    >
    <label for="autosize">Autosize textarea</label
    ><textarea
      id="autosize"
      buludTextarea
      buludTextareaAutosize
      placeholder="Type multiple lines"
    ></textarea>
    <div
      buludResizeObserver
      (sizeChange)="width.set($event.width)"
      buludClickOutside
      (outside)="outside.set(outside() + 1)"
    >
      <p>Resize observer: {{ width() }} px · Outside clicks: {{ outside() }}</p>
    </div>
    <p>
      {{ 'Bulud Library' | buludInitials }} · {{ 2048 | buludFileSize }} ·
      {{ 12345 | buludPersianDigits }} · {{ '۱۲۳۴۵' | buludEnglishDigits }}
    </p>
    <label for="pages">Page count</label
    ><input
      id="pages"
      type="number"
      min="1"
      max="1000000"
      [value]="count()"
      (change)="setCount($event)"
    />
    <div class="pagination">
      <bulud-pagination
        [pageCount]="count()"
        [currentPage]="page()"
        (pageChange)="page.set($event)"
      />
    </div>
    <bulud-dialog
      [open]="open()"
      (openChange)="open.set($event)"
      aria-label="Example dialog"
      ><h3>Example dialog</h3>
      <p>Escape closes this dialog.</p>
      <bulud-button (click)="open.set(false)"
        >Close dialog</bulud-button
      ></bulud-dialog
    >
  </section>`,
  styles: `
    .pagination {
      display: flex;
      justify-content: center;
      margin-block: 24px;
    }
    textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin-block: 12px;
    }
    bulud-tabs,
    bulud-accordion {
      display: block;
      margin-block: 24px;
    }
    input {
      max-width: 140px;
    }
  `,
})
export class BasePrimitives {
  readonly open = signal(false);
  readonly tab = signal<string | null>('first');
  readonly width = signal(0);
  readonly outside = signal(0);
  readonly page = signal(1);
  readonly count = signal(10);
  setCount(event: Event): void {
    const n = (event.target as HTMLInputElement).valueAsNumber;
    this.count.set(Number.isSafeInteger(n) && n > 0 ? Math.min(n, 1000000) : 1);
    this.page.set(Math.min(this.page(), this.count()));
  }
}
