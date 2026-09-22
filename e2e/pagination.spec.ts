import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('#pagination').scrollIntoViewIfNeeded();
});

test('is controlled, accessible, bounded, and keyboard operable', async ({
  page,
}) => {
  const section = page.locator('#pagination');
  const pagination = section.locator('#pagination-dynamic');
  const navigation = pagination.getByRole('navigation', {
    name: 'صفحه‌بندی نتایج',
  });
  await expect(
    navigation.getByRole('button', { name: 'صفحه فعلی، 5' }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(navigation.locator('.bulud-pagination__ellipsis')).toHaveCount(
    2,
  );
  await expect(navigation.getByRole('button')).toHaveCount(9);

  await navigation.getByRole('button', { name: 'رفتن به صفحه 8' }).click();
  await expect(section.locator('#pagination-current')).toHaveText(
    'Current page: 8',
  );
  await expect(
    navigation.getByRole('button', { name: 'صفحه فعلی، 8' }),
  ).toHaveAttribute('aria-current', 'page');
  await navigation.getByRole('button', { name: 'صفحه قبلی' }).click();
  await expect(section.locator('#pagination-current')).toHaveText(
    'Current page: 7',
  );
  await navigation.getByRole('button', { name: 'صفحه بعدی' }).press('Enter');
  await expect(section.locator('#pagination-current')).toHaveText(
    'Current page: 8',
  );
  await expect(
    navigation.getByRole('button', { name: 'صفحه بعدی' }),
  ).toBeFocused();

  await navigation
    .getByRole('button', { name: 'رفتن به صفحه 1' })
    .press('Enter');
  await expect(section.locator('#pagination-current')).toHaveText(
    'Current page: 1',
  );
  await expect(
    navigation.getByRole('button', { name: 'صفحه قبلی' }),
  ).toBeDisabled();
  await navigation.getByRole('button', { name: 'رفتن به صفحه 100' }).click();
  await expect(section.locator('#pagination-current')).toHaveText(
    'Current page: 100',
  );
  await expect(
    navigation.getByRole('button', { name: 'صفحه بعدی' }),
  ).toBeDisabled();
});

test('supports disabled, RTL, dark mode, and instance theme precedence', async ({
  page,
}) => {
  const section = page.locator('#pagination');
  const navigation = section
    .locator('#pagination-dynamic')
    .getByRole('navigation');
  await section.getByLabel('Disabled').check();
  await expect(navigation.getByRole('button').first()).toBeDisabled();
  await expect(section.locator('#pagination-current')).toHaveText(
    'Current page: 5',
  );
  await section.getByLabel('Disabled').uncheck();

  await section.getByLabel('RTL').check();
  await expect(section).toHaveAttribute('dir', 'rtl');
  await navigation.getByRole('button', { name: 'صفحه قبلی' }).click();
  await expect(section.locator('#pagination-current')).toHaveText(
    'Current page: 4',
  );
  await expect(
    navigation.locator(
      '.bulud-pagination__control--previous .bulud-pagination__direction-icon',
    ),
  ).toHaveCSS('transform', 'matrix(-1, 0, 0, 1, 0, 0)');

  await section.getByLabel('Dark theme').check();
  await expect(
    navigation.getByRole('button', { name: 'صفحه فعلی، 4' }),
  ).toHaveCSS('background-color', 'rgb(124, 58, 237)');
  const instance = section
    .locator('#pagination-instance-theme')
    .getByRole('button', {
      name: 'Current page, 2',
    });
  await expect(instance).toHaveCSS('background-color', 'rgb(20, 83, 45)');
  await expect(instance).toHaveCSS('width', '48px');
});

test('exposes the zero-page empty state with disabled navigation controls', async ({
  page,
}) => {
  const empty = page.locator('#pagination-empty');
  await expect(empty).toContainText('No pages available');

  const navigation = empty.getByRole('navigation', {
    name: 'Empty pagination',
  });
  const controls = navigation.getByRole('button');
  await expect(controls).toHaveCount(2);
  await expect(controls.nth(0)).toBeDisabled();
  await expect(controls.nth(1)).toBeDisabled();
});
