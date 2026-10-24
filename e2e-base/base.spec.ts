import { expect, test } from '@playwright/test';
for (const rtl of [true, false])
  for (const dark of [false, true])
    test(`Angour base ${rtl ? 'rtl' : 'ltr'} ${dark ? 'dark' : 'light'} is responsive and preserves preferences`, async ({
      page,
    }) => {
      await page.goto('/');
      if (!rtl)
        await page.getByRole('button', { name: 'Toggle language' }).click();
      if (dark)
        await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        rtl ? 'rtl' : 'ltr',
      );
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        dark ? 'dark' : 'light',
      );
      await expect(page.locator('.surface').first()).toHaveCSS(
        'background-color',
        dark ? 'rgb(30, 30, 38)' : 'rgb(255, 255, 255)',
      );
      await page.setViewportSize({ width: 390, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        rtl ? 'rtl' : 'ltr',
      );
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        dark ? 'dark' : 'light',
      );
      await page.goto('/forms');
      await expect(page.locator('form')).toBeVisible();
      await page.locator('#base-name').fill('Example User');
      await page.getByRole('button', { name: 'Toggle language' }).click();
      await expect(page.locator('#base-name')).toHaveValue('Example User');
      const field = page.locator('bulud-dropdown [role="combobox"]');
      await field.click();
      await page.getByRole('option', { name: 'angular', exact: true }).click();
      await page
        .getByRole('button', {
          name: rtl ? 'Clear selection' : 'پاک کردن انتخاب',
          exact: true,
        })
        .click();
      await expect(field).toHaveAttribute(
        'aria-describedby',
        'frameworks-error',
      );
      await expect(page.locator('#frameworks-error')).toHaveCSS(
        'color',
        dark ? 'rgb(255, 128, 128)' : 'rgb(161, 23, 41)',
      );
    });

test('validates all form controls, async errors, matching fields, selection limits and reset', async ({
  page,
}) => {
  await page.goto('/forms');
  await page.getByRole('button', { name: 'Toggle language' }).click();
  await page
    .getByRole('button', { name: 'Validate form', exact: true })
    .click();
  await expect(page.locator('#base-name')).toBeFocused();
  await expect(page.locator('#base-name')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.locator('#base-name').fill('Example User');
  await page.locator('#base-email').fill('used@example.com');
  await page.locator('#base-key').fill('angour-base');
  await expect(page.locator('#email-error')).toContainText('reserved');
  await page.locator('#base-email').fill('user@example.com');
  await page.locator('#base-website').fill('javascript:alert(1)');
  await page.locator('#base-key').click();
  await expect(page.locator('#website-error')).toContainText('http');
  await page.locator('#base-website').fill('https://example.com');
  await page.locator('#base-budget').fill('-1');
  await page.locator('#base-key').click();
  await expect(page.locator('#budget-error')).toContainText('positive');
  await page.locator('#base-budget').fill('120');
  await page.locator('#base-password').fill('sample-password');
  await page.locator('#base-confirm').fill('different');
  await expect(page.locator('#confirm-error')).toContainText('do not match');
  await page.locator('#base-confirm').fill('sample-password');
  const dropdown = page.getByRole('combobox', {
    name: 'Frameworks',
    exact: true,
  });
  await dropdown.click();
  for (const name of ['angular', 'react', 'vue'])
    await page.getByRole('option', { name, exact: true }).click();
  await page.locator('#base-key').click();
  await expect(page.locator('#frameworks-error')).toContainText('at most two');
  await dropdown.click();
  await page.getByRole('option', { name: 'vue', exact: true }).click();
  await page.locator('#base-key').click();
  await page.getByRole('radio', { name: 'Basic', exact: true }).check();
  await page.getByRole('button', { name: 'Start date', exact: true }).click();
  const calendar = page.getByRole('dialog', {
    name: 'Start date',
    exact: true,
  });
  await expect(calendar).toBeVisible();
  await calendar.locator('[data-date][tabindex="0"]').click();
  await page
    .getByRole('checkbox', { name: 'I accept the terms of use', exact: true })
    .check();
  await page
    .getByRole('button', { name: 'Validate form', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Validation succeeded' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('#base-name')).toHaveValue('');
  await expect(page.locator('.notice')).toHaveCount(0);
  await expect(
    page.getByRole('checkbox', {
      name: 'I accept the terms of use',
      exact: true,
    }),
  ).not.toBeChecked();
});
