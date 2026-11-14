import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/#line-chart-demo');
  await expect(page.locator('#line-chart-demo')).toBeVisible();
});
test('renders every public state in both directions and restores the chart', async ({
  page,
}) => {
  const demo = page.locator('#line-chart-demo');
  const select = demo.locator('select');
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
      await select.selectOption(state);
      if (state === 'loading' || state === 'error' || state === 'invalid')
        await expect(demo.getByRole('status')).toBeVisible();
      else {
        await expect(
          demo.getByRole('img', { name: 'Current and previous year' }),
        ).toBeVisible();
        if (state === 'disabled')
          await expect(demo.locator('svg')).not.toHaveAttribute(
            'tabindex',
            '0',
          );
      }
    }
  }
  await select.selectOption('default');
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
    'rgb(190, 40, 90)',
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
  await demo.locator('select').selectOption('fractional');
  const svg = demo.getByRole('img', { name: 'Current and previous year' });
  await svg.focus();
  await page.keyboard.press('Home');
  for (const locale of ['de-DE', 'fa-IR', 'ar-EG', 'tr-TR', 'ja-JP', 'en-US']) {
    await demo.locator('input').fill(locale);
    await svg.focus();
    await page.keyboard.press('Home');
    await expect(demo.getByRole('tooltip')).toContainText(
      new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
        1234.5,
      ),
    );
  }
});
