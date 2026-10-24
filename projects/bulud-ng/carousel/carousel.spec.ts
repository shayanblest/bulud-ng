import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludCarousel, BuludSlide } from './carousel';
@Component({
  imports: [BuludCarousel, BuludSlide],
  template: `<bulud-carousel label="Gallery"
    ><ng-template buludSlide="First">First content</ng-template
    ><ng-template buludSlide="Second">Second content</ng-template>
    <p buludCarouselEmpty>Empty</p></bulud-carousel
  >`,
})
class Host {}
describe('BuludCarousel', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('uses stable previous/next controls, correct boundaries and only renders current slide', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const buttons = f.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBeTrue();
    expect(f.nativeElement.textContent).not.toContain('Empty');
    buttons[1].click();
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[aria-roledescription=slide]').textContent,
    ).toContain('Second content');
    expect(buttons[1].disabled).toBeTrue();
    buttons[0].click();
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[aria-roledescription=slide]').textContent,
    ).toContain('First content');
  });
  it('is safe with no slides or invalid external index', async () => {
    const f = TestBed.createComponent(BuludCarousel);
    f.componentRef.setInput('label', 'Empty');
    f.componentRef.setInput('active', NaN);
    await f.whenStable();
    expect(f.nativeElement.querySelector('[aria-live]').textContent).toBe(
      '0 / 0',
    );
    expect(
      Array.from(
        f.nativeElement.querySelectorAll(
          'button',
        ) as NodeListOf<HTMLButtonElement>,
      ).every((b) => b.disabled),
    ).toBeTrue();
  });
});
