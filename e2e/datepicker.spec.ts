import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#angour-controls');
  await expect(
    page
      .locator('#angour-controls')
      .getByRole('heading', { name: 'فرم‌های انگور در Bulud', exact: true }),
  ).toBeVisible();
});
for (const direction of ['rtl', 'ltr'] as const) {
  for (const mode of ['light', 'dark'] as const) {
    test(`Datepicker single/range, ISO output, keyboard and Angour colors in ${mode} ${direction}`, async ({
      page,
    }) => {
      const scope = page.locator('#angour-controls');
      const rtl = direction === 'rtl';
      const dark = mode === 'dark';
      if (!rtl)
        await scope
          .getByRole('button', { name: 'Toggle controls language' })
          .click();
      if (dark)
        await scope
          .getByRole('button', { name: 'Toggle controls theme' })
          .click();
      const trigger = scope.getByRole('button', {
        name: rtl ? 'تاریخ نمونه' : 'Example date',
        exact: true,
      });
      await trigger.click();
      const dialog = scope.getByRole('dialog', {
        name: rtl ? 'تاریخ نمونه' : 'Example date',
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('.bulud-datepicker__heading')).toContainText(
        rtl ? 'فروردین 1404' : 'March 2025',
      );
      const years = dialog.locator('.bulud-datepicker__years');
      await expect(
        years.getByRole('button', { name: rtl ? '1404' : '2025', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      const calendarBox = await dialog
        .locator('.bulud-datepicker__calendar')
        .boundingBox();
      const yearsBox = await years.boundingBox();
      expect(yearsBox!.x).toBeGreaterThanOrEqual(
        calendarBox!.x + calendarBox!.width,
      );
      // Offscreen demo sections can change the page height while rendering.
      // Attachment is only meaningful while the anchor is in the viewport.
      await trigger.scrollIntoViewIfNeeded();
      await expect
        .poll(async () =>
          trigger.evaluate((el) => {
            const anchor = el.getBoundingClientRect();
            const popup = el
              .parentElement!.querySelector('[popover]')!
              .getBoundingClientRect();
            return Math.min(
              Math.abs(popup.top - anchor.bottom),
              Math.abs(popup.bottom - anchor.top),
            );
          }),
        )
        .toBeLessThan(2);
      await expect(dialog).toHaveCSS('direction', direction);
      await expect(dialog).toHaveCSS(
        'background-color',
        dark ? 'rgb(0, 0, 0)' : 'rgb(243, 246, 249)',
      );
      await expect(dialog.locator('th').first()).toHaveCSS('font-size', '12px');
      const selected = dialog.locator('[data-date="2025-03-21"]');
      await expect(selected).toBeFocused();
      await expect(selected).toHaveCSS(
        'background-color',
        dark ? 'rgba(213, 213, 213, 0.15)' : 'rgba(30, 30, 38, 0.15)',
      );
      await page.keyboard.press('ArrowDown');
      await expect(dialog.locator('[data-date="2025-03-28"]')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(scope.locator('#angour-date-value')).toHaveText(
        '2025-03-28',
      );
      await scope
        .getByRole('button', {
          name: rtl ? 'بازه نمونه' : 'Example range',
          exact: true,
        })
        .click();
      const range = scope.getByRole('dialog', {
        name: rtl ? 'بازه نمونه' : 'Example range',
        exact: true,
      });
      await range
        .getByRole('button', {
          name: rtl ? 'ماه قبل' : 'Previous month',
          exact: true,
        })
        .click();
      await range.locator('[data-date="2025-03-23"]').click();
      await expect(range).toBeVisible();
      await expect(scope.locator('#angour-range-value')).toHaveText(
        '2025-03-23,',
      );
      await range.locator('[data-date="2025-03-21"]').click();
      await expect(range).toBeHidden();
      await expect(scope.locator('#angour-range-value')).toHaveText(
        '2025-03-21,2025-03-23',
      );
      await scope
        .getByRole('button', { name: 'Reset dates', exact: true })
        .click();
      await scope
        .getByRole('button', { name: 'Validate dates', exact: true })
        .click();
      await expect(trigger).toHaveAttribute('aria-invalid', 'true');
      await expect(scope.locator('#angour-date-value')).toHaveText('empty');
    });
  }
}

test('supports bounds, year/month keys, instance precedence, clear, focus restoration and disabled state', async ({
  page,
}) => {
  const scope = page.locator('#angour-controls');
  await scope.getByRole('button', { name: 'Toggle controls language' }).click();
  await expect(
    scope.getByRole('button', { name: 'Disabled date', exact: true }),
  ).toBeDisabled();
  const bounded = scope.getByRole('button', {
    name: 'Bounded date',
    exact: true,
  });
  await bounded.click();
  let dialog = scope.getByRole('dialog', { name: 'Bounded date', exact: true });
  await expect(dialog.locator('[data-date="2025-03-14"]')).toBeDisabled();
  await expect(dialog.locator('[data-date="2025-03-26"]')).toBeDisabled();
  await expect(
    dialog.getByRole('button', { name: 'Previous month' }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole('button', { name: 'Next month' }),
  ).toBeDisabled();
  await page.keyboard.press('Home');
  await expect(dialog.locator('[data-date="2025-03-16"]')).toBeFocused();
  await page.keyboard.press('PageUp');
  await expect(dialog.locator('[data-date="2025-03-15"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(bounded).toBeFocused();
  const custom = scope.getByRole('button', {
    name: 'Custom date',
    exact: true,
  });
  await custom.click();
  dialog = scope.getByRole('dialog', { name: 'Custom date', exact: true });
  await expect(dialog.locator('[data-date="2025-03-21"]')).toHaveCSS(
    'background-color',
    'rgb(21, 55, 91)',
  );
  await page.keyboard.press('Home');
  await expect(dialog.locator('[data-date="2025-03-16"]')).toBeFocused();
  await page.keyboard.press('End');
  await expect(dialog.locator('[data-date="2025-03-22"]')).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect(dialog.locator('[data-date="2025-04-22"]')).toBeFocused();
  await page.keyboard.press('Shift+PageDown');
  await expect(dialog.locator('[data-date="2026-04-22"]')).toBeFocused();
  await dialog.getByRole('button', { name: '2024', exact: true }).click();
  await expect(dialog.locator('.bulud-datepicker__heading')).toContainText(
    '2024',
  );
  await page.keyboard.press('Escape');
  await custom.press('Delete');
  await expect(dialog).toBeHidden();
  await expect(custom).toBeFocused();
  await expect(custom).toContainText('Select a date');
});

test('dismisses on outside click and Tab, restores on Escape and preserves ISO when switching calendar', async ({
  page,
}) => {
  const scope = page.locator('#angour-controls');
  const trigger = scope.getByRole('button', {
    name: 'تاریخ نمونه',
    exact: true,
  });
  await expect(trigger).toContainText('1404/1/1');
  await trigger.click();
  const dialog = scope.getByRole('dialog', {
    name: 'تاریخ نمونه',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.locator('[data-year="1404"]').focus();
  await page.keyboard.press('Tab');
  await expect(dialog).toBeHidden();
  await expect(
    scope.getByRole('button', { name: 'بازه نمونه', exact: true }),
  ).toBeFocused();
  await trigger.click();
  await scope
    .getByRole('heading', { name: 'انتخاب تاریخ و بازه', exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await scope.getByRole('button', { name: 'Toggle controls language' }).click();
  await expect(
    scope.getByRole('button', { name: 'Example date', exact: true }),
  ).toContainText('2025/3/21');
  await expect(scope.locator('#angour-date-value')).toHaveText('2025-03-21');
});

test('year rail scrolls, navigates without changing the value, and popup stays inside a narrow viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const scope = page.locator('#angour-controls');
  const trigger = scope.getByRole('button', {
    name: 'تاریخ نمونه',
    exact: true,
  });
  await trigger.click();
  const dialog = scope.getByRole('dialog', {
    name: 'تاریخ نمونه',
    exact: true,
  });
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(8);
  expect(box!.x + box!.width).toBeLessThanOrEqual(382);
  expect(box!.y).toBeGreaterThanOrEqual(8);
  expect(box!.y + box!.height).toBeLessThanOrEqual(692);
  const rail = dialog.locator('.bulud-datepicker__years');
  expect(await rail.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
    true,
  );
  await rail.locator('[data-year="1390"]').click();
  await expect(dialog.locator('.bulud-datepicker__heading')).toContainText(
    '1390',
  );
  await page.keyboard.press('ArrowUp');
  await expect(rail.locator('[data-year="1391"]')).toBeFocused();
  await expect(scope.locator('#angour-date-value')).toHaveText('2025-03-21');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('keeps the open calendar attached when earlier page content changes height', async ({
  page,
}) => {
  const scope = page.locator('#angour-controls');
  const trigger = scope.getByRole('button', {
    name: 'تاریخ نمونه',
    exact: true,
  });
  await trigger.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await trigger.click();
  const distance = () =>
    trigger.evaluate((el) => {
      const anchor = el.getBoundingClientRect();
      const popup = el
        .parentElement!.querySelector('[popover]')!
        .getBoundingClientRect();
      return Math.min(
        Math.abs(popup.top - anchor.bottom),
        Math.abs(popup.bottom - anchor.top),
      );
    });
  await expect.poll(distance).toBeLessThan(2);
  await page.evaluate(() => {
    document.documentElement.style.overflowAnchor = 'none';
    document.body.style.overflowAnchor = 'none';
    const spacer = document.createElement('div');
    spacer.style.height = '80px';
    document.querySelector('#angour-controls')!.before(spacer);
  });
  await expect.poll(distance).toBeLessThan(2);
});
