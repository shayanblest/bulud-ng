import {
  Component,
  provideZonelessChangeDetection,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludRuntime } from 'bulud-ng/runtime';
import { BuludCarousel } from './carousel';
@Component({
  imports: [BuludCarousel],
  template: `<bulud-carousel
    presentation="scroll"
    label="Promotions"
    [defaultIndex]="initial()"
  >
    @for (item of items(); track item) {
      <article>Promotion {{ item }}</article>
    }
  </bulud-carousel>`,
})
class Host {
  readonly items = signal([1, 2, 3]);
  readonly initial = signal(1);
  readonly carousel = viewChild.required(BuludCarousel);
}
describe('BuludCarousel projected native scrolling', () => {
  const direction = signal<'ltr' | 'rtl'>('ltr');
  const width = signal(1280);
  beforeEach(() => {
    direction.set('ltr');
    width.set(1280);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BuludRuntime,
          useValue: {
            direction,
            viewportWidth: width,
            text: (_key: string, fallback: string) => fallback,
          },
        },
      ],
    });
  });
  it('uses the default slide and sizes projected children to exactly one viewport, with accessible dot controls', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const viewport = f.nativeElement.querySelector(
      '.carousel-viewport',
    ) as HTMLElement;
    expect(f.componentInstance.carousel().active()).toBe(1);
    expect(viewport.clientWidth).toBeGreaterThan(0);
    expect(viewport.scrollLeft).toBeCloseTo(viewport.clientWidth, 0);
    const children = f.nativeElement.querySelectorAll(
      'article',
    ) as NodeListOf<HTMLElement>;
    for (const child of children)
      expect(child.getBoundingClientRect().width).toBeCloseTo(
        viewport.clientWidth,
        0,
      );
    const dots = f.nativeElement.querySelectorAll('.dots-container button');
    expect(dots.length).toBe(3);
    expect(dots[1].getAttribute('aria-current')).toBe('true');
    expect(dots[1].getAttribute('aria-label')).toBe('Slide 2');
  });
  it('reacts to projected insertion, direction and default-index changes', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    f.componentInstance.items.set([1, 2, 3, 4]);
    await f.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await f.whenStable();
    expect(
      f.nativeElement.querySelectorAll('.dots-container button').length,
    ).toBe(4);
    expect(f.componentInstance.carousel().active()).toBe(1);
    direction.set('rtl');
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('bulud-carousel[presentation=scroll]').dir,
    ).toBe('rtl');
    const viewport = f.nativeElement.querySelector(
      '.carousel-viewport',
    ) as HTMLElement;
    expect(viewport.scrollLeft).toBeCloseTo(-viewport.clientWidth, 0);
    f.componentInstance.initial.set(2);
    await f.whenStable();
    expect(f.componentInstance.carousel().active()).toBe(2);
    expect(viewport.scrollLeft).toBeCloseTo(-2 * viewport.clientWidth, 0);
  });

  it('measures all instances before writing scroll positions on responsive changes', async () => {
    const first = TestBed.createComponent(Host);
    const second = TestBed.createComponent(Host);
    await first.whenStable();
    await second.whenStable();
    const operations: string[] = [];
    for (const fixture of [first, second]) {
      const viewport = fixture.nativeElement.querySelector(
        '.carousel-viewport',
      ) as HTMLElement;
      const currentWidth = viewport.clientWidth;
      spyOnProperty(viewport, 'clientWidth', 'get').and.callFake(() => {
        operations.push('read');
        return currentWidth;
      });
      spyOn(viewport, 'scrollTo').and.callFake(() => {
        operations.push('write');
      });
    }
    width.set(900);
    await first.whenStable();
    await second.whenStable();
    expect(operations.filter((operation) => operation === 'read').length).toBe(
      2,
    );
    expect(operations.filter((operation) => operation === 'write').length).toBe(
      2,
    );
    expect(operations.lastIndexOf('read')).toBeLessThan(
      operations.indexOf('write'),
    );
  });

  it('applies the default to asynchronously projected slides and clamps removals', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.items.set([]);
    await fixture.whenStable();
    fixture.componentInstance.items.set([1, 2, 3]);
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await fixture.whenStable();
    expect(fixture.componentInstance.carousel().active()).toBe(1);
    fixture.componentInstance.items.set([1]);
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await fixture.whenStable();
    expect(fixture.componentInstance.carousel().active()).toBe(0);
  });
});
