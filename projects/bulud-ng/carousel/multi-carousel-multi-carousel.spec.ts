import {
  Component,
  provideZonelessChangeDetection,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BULUD_SHARED_UI_CONFIG } from 'bulud-ng';
import { BuludRuntime } from 'bulud-ng/runtime';
import {
  BULUD_CAROUSEL_CONFIG,
  BuludCarouselLayout,
  BuludCarousel,
} from './carousel';
@Component({
  imports: [BuludCarousel],
  template: `<bulud-carousel presentation="multi"
    label="Accounts"
    [config]="config()"
    [defaultIndex]="initial()"
  >
    @for (item of items(); track item) {
      <ng-template #carouselItem
        ><p>Account {{ item }}</p></ng-template
      >
    }
  </bulud-carousel>`,
})
class Host {
  readonly config = signal<BuludCarouselLayout | undefined>(undefined);
  readonly items = signal([1, 2, 3, 4, 5]);
  readonly initial = signal(0);
  readonly carousel = viewChild.required(BuludCarousel);
}
describe('BuludCarousel responsive projected cards', () => {
  const width = signal(1280),
    direction = signal<'ltr' | 'rtl'>('ltr');
  beforeEach(() => {
    width.set(1280);
    direction.set('ltr');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BuludRuntime,
          useValue: {
            viewportWidth: width,
            direction,
            text: (_key: string, fallback: string) => fallback,
          },
        },
        {
          provide: BULUD_CAROUSEL_CONFIG,
          useValue: {
            layout: { itemsPerSlide: 3, step: 2 },
            defaults: { itemsPerSlide: 2 },
          },
        },
        {
          provide: BULUD_SHARED_UI_CONFIG,
          useValue: {
            theme: { gap: '2px' },
            components: { 'multi-carousel': { gap: '4px' } },
          },
        },
      ],
    });
  });
  it('resolves layout precedence, retains multiple visible cards and clamps final partial navigation', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const carousel = f.componentInstance.carousel();
    expect(carousel.layout()).toEqual({ perSlide: 2, step: 2 });
    expect(carousel.pageCount()).toBe(3);
    const items = f.nativeElement.querySelectorAll('.itb-carousel__item');
    expect(items.length).toBe(5);
    expect(items[0].style.width).toBe('50%');
    carousel.next();
    carousel.next();
    carousel.next();
    await f.whenStable();
    expect(carousel.index()).toBe(2);
    expect(
      f.nativeElement.querySelector('.itb-carousel__wrapper').style.transform,
    ).toBe('translate3d(-150%, 0px, 0px)');
    f.componentInstance.config.set({ itemsPerSlide: 1, step: 1 });
    await f.whenStable();
    expect(carousel.layout()).toEqual({ perSlide: 1, step: 1 });
    f.componentInstance.config.set({ itemsPerSlide: undefined });
    await f.whenStable();
    expect(carousel.layout().perSlide).toBe(2);
  });
  it('responds to breakpoints, live RTL and asynchronous card insertion without navigation reset', async () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.config.set({
      itemsPerSlide: 3,
      step: 1,
      sizes: { 600: { itemsPerSlide: 1 }, 1000: { itemsPerSlide: 2 } },
    });
    await f.whenStable();
    const carousel = f.componentInstance.carousel();
    expect(carousel.layout().perSlide).toBe(3);
    width.set(800);
    await f.whenStable();
    expect(carousel.layout().perSlide).toBe(2);
    carousel.next();
    await f.whenStable();
    direction.set('rtl');
    await f.whenStable();
    expect(f.nativeElement.querySelector('.itb-carousel__viewport').dir).toBe(
      'rtl',
    );
    expect(
      f.nativeElement.querySelector('.itb-carousel__wrapper').style.transform,
    ).toBe('translate3d(50%, 0px, 0px)');
    width.set(375);
    await f.whenStable();
    expect(carousel.layout().perSlide).toBe(1);
    expect(carousel.index()).toBe(1);
    f.componentInstance.items.set([]);
    await f.whenStable();
    expect(carousel.index()).toBe(0);
    f.componentInstance.initial.set(1);
    f.componentInstance.items.set([1, 2, 3]);
    await f.whenStable();
    expect(carousel.index()).toBe(1);
  });
  it('distinguishes vertical gestures and horizontal drag with final snapping', async () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.config.set({ itemsPerSlide: 2, step: 1 });
    await f.whenStable();
    const viewport = f.nativeElement.querySelector(
      '.itb-carousel__viewport',
    ) as HTMLElement;
    Object.defineProperty(viewport, 'clientWidth', { value: 300 });
    spyOn(viewport, 'setPointerCapture');
    viewport.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 7,
        pointerType: 'mouse',
        button: 0,
        clientX: 200,
        clientY: 10,
      }),
    );
    viewport.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 7,
        clientX: 190,
        clientY: 100,
        cancelable: true,
      }),
    );
    viewport.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7 }));
    await f.whenStable();
    expect(f.componentInstance.carousel().index()).toBe(0);
    viewport.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 8,
        pointerType: 'mouse',
        button: 0,
        clientX: 200,
        clientY: 10,
      }),
    );
    viewport.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 8,
        clientX: 50,
        clientY: 10,
        cancelable: true,
      }),
    );
    viewport.dispatchEvent(new PointerEvent('pointerup', { pointerId: 8 }));
    await f.whenStable();
    expect(f.componentInstance.carousel().index()).toBe(1);
    expect(viewport.style.userSelect).toBe('');
    expect(f.nativeElement.querySelector('.dragging')).toBeNull();
  });
});
