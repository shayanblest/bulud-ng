import { test, expect } from '@playwright/test';
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
      await demo.locator('select').selectOption(state);
      if (['empty', 'loading', 'error', 'invalid'].includes(state))
        await expect(demo.getByRole('status')).toBeVisible();
      else {
        await expect(demo.locator('svg')).toBeVisible();
        if (state === 'disabled')
          await expect(demo.locator('.bulud-radial-value')).not.toHaveAttribute(
            'tabindex',
            '0',
          );
      }
    }
  }
  await demo.locator('select').selectOption('default');
  const ring = demo.locator('.bulud-radial-value');
  await ring.focus();
  await page.keyboard.press('Enter');
  await expect(ring).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(ring).toHaveAttribute('aria-pressed', 'false');
  await demo.getByRole('button', { name: 'Toggle radial theme' }).click();
  await expect(ring).toHaveCSS('stroke', 'rgb(190, 40, 90)');
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
  await demo.locator('select').selectOption('fractional');
  for (const locale of ['de-DE', 'fa-IR', 'ar-EG', 'tr-TR', 'ja-JP', 'en-US']) {
    await demo.locator('input').first().fill(locale);
    await expect(demo.locator('.bulud-radial-text')).toHaveText(
      new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: 20,
      }).format(0.335),
    );
  }
  await demo.locator('input').nth(1).fill('موفقیت');
  await expect(demo.locator('.bulud-radial-label')).toHaveText('موفقیت');
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await expect
      .poll(async () => Number(await demo.locator('svg').getAttribute('width')))
      .toBeLessThanOrEqual(width);
    await expect(demo.locator('.bulud-radial-text')).toHaveText('33.5%');
  }
});
