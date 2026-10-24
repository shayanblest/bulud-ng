import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/shared');
  await page.getByRole('button', { name: 'Toggle language' }).click();
});
test('filters combine, reset page, persist in URL, and work with simulated server paging', async ({
  page,
}) => {
  await page.locator('bulud-table-filters summary').click();
  await page
    .getByRole('spinbutton', { name: 'Minimum ID', exact: true })
    .fill('20');
  await expect(page).toHaveURL(/filter=/);
  await expect(page.locator('bulud-table tbody tr')).toHaveCount(5);
  await expect(page.locator('bulud-table tbody tr').first()).toContainText(
    'Project 20',
  );
  await page
    .getByRole('combobox', { name: 'Record status', exact: true })
    .click();
  await page.getByRole('option', { name: 'active', exact: true }).click();
  await expect(page.locator('bulud-table tbody tr')).toHaveCount(3);
  await page
    .getByRole('checkbox', {
      name: 'Server pagination (simulated)',
      exact: true,
    })
    .check();
  await expect(page.locator('bulud-table tbody tr')).toHaveCount(3);
  await page
    .getByRole('button', { name: 'Clear filters', exact: true })
    .click();
  await expect(page).not.toHaveURL(/filter=/);
  await expect(page.locator('bulud-table tbody tr')).toHaveCount(5);
  await page.getByLabel('Created after', { exact: true }).fill('2026-10-23');
  await expect(page.locator('bulud-table tbody tr')).toHaveCount(2);
  await page.goBack();
  await expect(page.locator('bulud-table tbody tr')).toHaveCount(5);
});
test('expanded details use a chevron, themed native textarea and keyboard collapse', async ({
  page,
}) => {
  const toggle = page
    .getByRole('button', { name: 'Show details', exact: true })
    .first();
  await toggle.focus();
  await toggle.press('Enter');
  const expanded = page.getByRole('button', {
    name: 'Hide details',
    exact: true,
  });
  await expect(expanded.locator('svg')).toHaveCount(1);
  await expect(expanded).toHaveAttribute('aria-expanded', 'true');
  const note = page.getByRole('textbox', { name: 'Note', exact: true });
  await expect(note).toHaveCSS('min-height', '126px');
  await note.fill('A useful note');
  await expanded.press('Enter');
  await expect(expanded).toHaveCount(0);
  await toggle.click();
  await expect(note).toHaveValue('A useful note');
  const pagination = page.locator('bulud-pagination');
  await expect(
    pagination.getByRole('button', { name: 'Next page', exact: true }),
  ).toHaveCSS('border-top-width', '1px');
});
test('top progress line follows explicit progress and finishes cleanly', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'Start page loading', exact: true })
    .click();
  const bar = page.getByRole('progressbar', {
    name: 'Page loading',
    exact: true,
  });
  await expect(bar).toHaveAttribute('aria-valuenow', '10');
  await expect(bar).toHaveCSS('height', '7px');
  await page
    .getByRole('button', { name: 'Progress to 70%', exact: true })
    .click();
  await expect(bar).toHaveAttribute('aria-valuenow', '70');
  await page
    .getByRole('button', { name: 'Finish page loading', exact: true })
    .click();
  await expect(bar).toHaveCount(0);
});
for (const language of ['en', 'fa'])
  for (const dark of [false, true])
    test(`charts render both models with accessible states ${language} ${dark}`, async ({
      page,
    }) => {
      if (language === 'fa')
        await page.getByRole('button', { name: 'Toggle language' }).click();
      if (dark)
        await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
      await page.goto('/charts');
      const chart = page.locator('bulud-chart');
      await expect(chart.locator('polyline')).toHaveCount(1);
      await expect(chart.locator('svg.plot')).toHaveCSS('direction', 'ltr');
      expect(
        await chart.locator('svg.plot').evaluate((svg) => {
          const label = svg.querySelector('text.axis');
          const grid = svg.querySelector('line.grid');
          return label && grid
            ? label.getBoundingClientRect().right <=
                grid.getBoundingClientRect().left
            : false;
        }),
      ).toBe(true);
      await expect(chart.locator('polyline')).toHaveCSS(
        'stroke',
        dark ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)',
      );
      const candle = chart.getByRole('button', {
        name: language === 'fa' ? 'کندلی' : 'Candlestick',
        exact: true,
      });
      await candle.focus();
      await candle.press('Enter');
      await expect(candle).toHaveAttribute('aria-pressed', 'true');
      await expect(chart.locator('.candle.up').first()).toHaveCSS(
        'fill',
        'rgb(10, 102, 194)',
      );
      await expect(chart.locator('.candle:not(.up)').first()).toHaveCSS(
        'fill',
        'rgb(245, 166, 35)',
      );
      await chart.locator('summary').click();
      await expect(chart.getByRole('table')).toBeVisible();
      await page
        .getByRole('button', {
          name: language === 'fa' ? 'روزانه' : 'Daily',
          exact: true,
        })
        .click();
      await expect(chart.locator('.candle')).toHaveCount(6);
      const checkbox = (fa: string, en: string) =>
        page.getByRole('checkbox', {
          name: language === 'fa' ? fa : en,
          exact: true,
        });
      await checkbox('رنگ سفارشی', 'Custom theme').check();
      await expect(chart.locator('.candle.up').first()).toHaveCSS(
        'fill',
        'rgb(126, 34, 206)',
      );
      await checkbox('غیرفعال', 'Disabled').check();
      await expect(candle).toBeDisabled();
      await checkbox('غیرفعال', 'Disabled').uncheck();
      await checkbox('داده نامعتبر', 'Invalid data').check();
      await expect(chart.getByRole('status')).toContainText(
        language === 'fa' ? 'نامعتبر' : 'Invalid',
      );
      await checkbox('داده نامعتبر', 'Invalid data').uncheck();
      await checkbox('خالی', 'Empty').check();
      await expect(chart.getByRole('status')).toContainText(
        language === 'fa' ? 'وجود ندارد' : 'No chart data',
      );
      await checkbox('بارگذاری', 'Loading').check();
      await expect(chart.getByRole('status')).toContainText(
        language === 'fa' ? 'بارگذاری' : 'Loading',
      );
    });
