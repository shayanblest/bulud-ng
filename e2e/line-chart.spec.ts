import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
async function choose(demo: Locator, value: string) {
  await demo.getByRole('combobox', { name: 'Chart state' }).click();
  await demo.getByRole('option', { name: value, exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/#line-chart-demo');
  await expect(page.locator('#line-chart-demo')).toBeVisible();
});
test('renders every public state in both directions and restores the chart', async ({
  page,
}) => {
  const demo = page.locator('#line-chart-demo');

  for (const dir of ['ltr', 'rtl']) {
    if (dir === 'rtl')
      await demo
        .getByRole('button', { name: 'Toggle chart direction' })
        .click();
    for (const state of [
      'default',
      'grade',
      'empty',
      'zero',
      'constant',
      'negative',
      'gaps',
      'fractional',
      'invalid',
      'loading',
      'error',
      'disabled',
    ]) {
      await choose(demo, state);
      if (state === 'loading' || state === 'error' || state === 'invalid')
        await expect(demo.getByRole('status')).toBeVisible();
      else {
        await expect(
          demo.getByRole('img', { name: 'Current and previous year' }),
        ).toBeVisible();
        if (state === 'disabled')
          await expect(
            demo.locator('bulud-line-chart svg[role=img]'),
          ).not.toHaveAttribute('tabindex', '0');
      }
    }
  }
  await choose(demo, 'default');
  await expect(demo.locator('path.bulud-line-chart-line')).toHaveCount(2);
});
test('keyboard and pointer reach both series; Escape dismisses; theme overrides compute', async ({
  page,
}) => {
  const demo = page.locator('#line-chart-demo');
  const svg = demo.getByRole('img', { name: 'Current and previous year' });
  await svg.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await expect(demo.getByRole('tooltip')).toContainText('200');
  await page.keyboard.press('ArrowDown');
  await expect(demo.getByRole('tooltip')).toContainText('130');
  await page.keyboard.press('End');
  await expect(demo.getByRole('tooltip')).toContainText('400');
  await page.keyboard.press('Escape');
  await expect(demo.getByRole('tooltip')).toHaveCount(0);
  await demo.getByRole('button', { name: 'Toggle instance theme' }).click();
  await expect(demo.locator('path.bulud-line-chart-line').first()).toHaveCSS(
    'stroke',
    'rgb(12, 35, 64)',
  );
  const path = demo.locator('path.bulud-line-chart-line').first();
  await svg.scrollIntoViewIfNeeded();
  const b = await path.boundingBox();
  expect(b).not.toBeNull();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2);
  await expect(demo.getByRole('tooltip')).toBeVisible();
});

test('changes arbitrary consumer locales without rebuilding the chart', async ({
  page,
}) => {
  const demo = page.locator('#line-chart-demo');
  await choose(demo, 'fractional');
  const svg = demo.getByRole('img', { name: 'Current and previous year' });
  await svg.focus();
  await page.keyboard.press('Home');
  for (const locale of ['de-DE', 'fa-IR', 'ar-EG', 'tr-TR', 'ja-JP', 'en-US']) {
    await demo
      .locator('input:not([type=checkbox]):not([type=color])')
      .first()
      .fill(locale);
    await svg.focus();
    await page.keyboard.press('Home');
    await expect(demo.getByRole('tooltip')).toContainText(
      new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
        1234.5,
      ),
    );
  }
});
