import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
async function choose(demo: Locator, value: string) {
  await demo.getByRole('combobox', { name: 'Chart state' }).click();
  await demo.getByRole('option', { name: value, exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/#radial-chart-demo');
  await expect(page.locator('#radial-chart-demo')).toBeVisible();
});
test('all radial states and directions; pointer and keyboard toggle; instance theme', async ({
  page,
}) => {
  const demo = page.locator('#radial-chart-demo');
  for (const direction of ['ltr', 'rtl']) {
    if (direction === 'rtl')
      await demo
        .getByRole('button', { name: 'Toggle radial direction' })
        .click();
    for (const state of [
      'default',
      'zero',
      'full',
      'fractional',
      'empty',
      'loading',
      'error',
      'invalid',
      'disabled',
    ]) {
      await choose(demo, state);
      if (['empty', 'loading', 'error', 'invalid'].includes(state))
        await expect(demo.getByRole('status')).toBeVisible();
      else {
        await expect(demo.locator('bulud-radial-chart svg')).toBeVisible();
        if (state === 'disabled')
          await expect(demo.locator('.bulud-radial-value')).not.toHaveAttribute(
            'tabindex',
            '0',
          );
      }
    }
  }
  await choose(demo, 'default');
  const ring = demo.locator('.bulud-radial-value');
  await ring.focus();
  await expect(ring).toHaveAttribute('aria-disabled', 'false');
  await ring.press('Enter');
  await expect(ring).toHaveAttribute('aria-pressed', 'true');
  await ring.press('Space');
  await expect(ring).toHaveAttribute('aria-pressed', 'false');
  await demo.getByRole('button', { name: 'Toggle radial theme' }).click();
  await expect(ring).toHaveCSS('stroke', 'rgb(12, 35, 64)');
  await ring.scrollIntoViewIfNeeded();
  const point = await ring.evaluate((el) => {
    const path = el as SVGPathElement,
      p = path.getPointAtLength(path.getTotalLength() / 2),
      m = path.getScreenCTM()!;
    return { x: p.x * m.a + m.e, y: p.y * m.d + m.f };
  });
  await page.mouse.move(point.x, point.y);
  await expect(ring).toHaveAttribute('filter', /-hover\)/);
  await page.mouse.click(point.x, point.y);
  await expect(ring).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(0, 0);
  await expect(ring).toHaveAttribute('filter', /-selected\)/);
});
test('reactive arbitrary locale, labels and resize retain percentage', async ({
  page,
}) => {
  const demo = page.locator('#radial-chart-demo');
  await choose(demo, 'fractional');
  for (const locale of ['de-DE', 'fa-IR', 'ar-EG', 'tr-TR', 'ja-JP', 'en-US']) {
    await demo
      .getByRole('textbox', { name: 'Locale (any BCP 47 tag)' })
      .fill(locale);
    await expect(demo.locator('.bulud-radial-text')).toHaveText(
      new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: 20,
      }).format(0.335),
    );
  }
  await demo.getByRole('textbox', { name: 'Chart label' }).fill('موفقیت');
  await expect(demo.locator('.bulud-radial-label')).toHaveText('موفقیت');
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await expect
      .poll(async () =>
        Number(
          await demo.locator('bulud-radial-chart svg').getAttribute('width'),
        ),
      )
      .toBeLessThanOrEqual(width);
    await expect(demo.locator('.bulud-radial-text')).toHaveText('33.5%');
  }
});
