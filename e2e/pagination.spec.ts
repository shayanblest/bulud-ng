import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
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
  await expect(navigation.getByRole('button')).toHaveCount(7);

  const currentPage = navigation.getByRole('button', {
    name: 'صفحه فعلی، 5',
  });
  await currentPage.hover();
  await expect(currentPage).toHaveCSS('background-color', 'rgb(124, 58, 237)');

  const normalPage = navigation.getByRole('button', {
    name: 'رفتن به صفحه 6',
  });
  await normalPage.hover();
  await expect(normalPage).toHaveCSS('background-color', 'rgb(248, 250, 252)');

  const buttons = navigation.getByRole('button');
  const buttonNames = await buttons.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('aria-label')),
  );
  const pageOneIndex = buttonNames.indexOf('رفتن به صفحه 1');
  const normalPageIndex = buttonNames.indexOf('رفتن به صفحه 6');
  expect(pageOneIndex).toBeGreaterThanOrEqual(0);
  expect(normalPageIndex).toBeGreaterThan(pageOneIndex);

  await buttons.nth(pageOneIndex).focus();
  for (let index = pageOneIndex; index < normalPageIndex; index += 1) {
    await page.keyboard.press('Tab');
  }
  await expect(normalPage).toBeFocused();
  await expect(normalPage).toHaveCSS('outline-style', 'solid');
  await expect(normalPage).toHaveCSS('outline-width', '3px');
  await expect(normalPage).toHaveCSS('outline-offset', '2px');

  await normalPage.click();
  await expect(section.locator('#pagination-current')).toHaveText(
    'Current page: 6',
  );
  await expect(
    navigation.getByRole('button', { name: 'صفحه فعلی، 6' }),
  ).toHaveAttribute('aria-current', 'page');
  await navigation.getByRole('button', { name: 'صفحه قبلی' }).click();
  await expect(section.locator('#pagination-current')).toHaveText(
    'Current page: 5',
  );
  await navigation.getByRole('button', { name: 'صفحه بعدی' }).press('Enter');
  await expect(section.locator('#pagination-current')).toHaveText(
    'Current page: 6',
  );
  await expect(
    navigation.getByRole('button', { name: 'صفحه بعدی' }),
  ).toBeFocused();

  await navigation
    .getByRole('button', { name: 'رفتن به صفحه 1', exact: true })
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

test('contains narrow multi-digit pagination overflow and keeps every control reachable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const section = page.locator('#pagination');
  const pagination = page.locator('#pagination-dynamic');
  const navigation = pagination.getByRole('navigation');

  await expect(navigation.getByRole('button')).toHaveCount(7);
  await expect(
    navigation.getByRole('button', { name: 'رفتن به صفحه 100' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await section.getByLabel('RTL').check();
  await expect(section).toHaveAttribute('dir', 'rtl');
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  const buttons = navigation.getByRole('button');
  for (let index = 0; index < (await buttons.count()); index += 1) {
    const button = buttons.nth(index);
    await button.scrollIntoViewIfNeeded();
    await button.focus();
    await expect(button).toBeFocused();
    expect(
      await button.evaluate((element) => {
        const host = element
          .closest('bulud-pagination')
          ?.getBoundingClientRect();
        const control = element.getBoundingClientRect();
        return Boolean(
          host && control.right > host.left && control.left < host.right,
        );
      }),
    ).toBe(true);
  }

  await navigation.getByRole('button', { name: 'رفتن به صفحه 100' }).click();
  await expect(page.locator('#pagination-current')).toHaveText(
    'Current page: 100',
  );
  await expect(
    navigation.getByRole('button', { name: 'صفحه بعدی' }),
  ).toBeDisabled();
});
