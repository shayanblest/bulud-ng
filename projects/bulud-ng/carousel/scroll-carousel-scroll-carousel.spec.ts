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
  template: `<bulud-carousel presentation="scroll"
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
    expect(f.nativeElement.querySelector('bulud-carousel[presentation=scroll]').dir).toBe(
      'rtl',
    );
    const viewport = f.nativeElement.querySelector(
      '.carousel-viewport',
    ) as HTMLElement;
    expect(viewport.scrollLeft).toBeCloseTo(-viewport.clientWidth, 0);
    f.componentInstance.initial.set(2);
    await f.whenStable();
    expect(f.componentInstance.carousel().active()).toBe(2);
    expect(viewport.scrollLeft).toBeCloseTo(-2 * viewport.clientWidth, 0);
  });
});
