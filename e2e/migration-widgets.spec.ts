import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/#migration-widgets-demo');
  await expect(page.locator('#migration-widgets-demo')).toBeVisible();
});
test('portable languages and SVG icons stay reactive across four locales and a fifth project locale', async ({
  page,
}) => {
  const demo = page.locator('#migration-widgets-demo'),
    switcher = demo.locator('bulud-language-switch');
  await expect(switcher.locator('svg').first()).toBeVisible();
  for (const [label, dir] of [
    ['فارسی', 'rtl'],
    ['العربية', 'rtl'],
    ['Türkçe', 'ltr'],
    ['English', 'ltr'],
  ]) {
    await switcher.getByRole('combobox').click();
    await switcher.getByRole('option').filter({ hasText: label }).click();
    await expect(demo).toHaveAttribute('dir', dir);
  }
  await demo.getByRole('button', { name: 'Add widget language' }).click();
  await expect(switcher).toContainText('Deutsch');
  await switcher.getByRole('combobox').click();
  await expect(switcher.getByRole('option')).toHaveCount(5);
});
test('month bounds, keyboard selection, theme overrides and previous/next output remain functional', async ({
  page,
}) => {
  const demo = page.locator('#migration-widgets-demo'),
    grid = demo.locator('bulud-period-picker[presentation=grid]');
  await expect(demo.getByTestId('widget-month')).toHaveText('2025-06');
  await grid.getByRole('button', { name: 'Report month', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    grid.getByRole('button', { name: 'Apr', exact: true }),
  ).toBeDisabled();
  await grid.getByRole('button', { name: 'Jul', exact: true }).click();
  await expect(demo.getByTestId('widget-month')).toHaveText('2025-07');
  await demo.getByLabel('Override month theme').check();
  await expect(grid.locator('.display')).toHaveCSS(
    'background-color',
    'rgb(12, 35, 64)',
  );
  await demo
    .locator('bulud-period-picker[presentation=navigation]')
    .getByRole('button', { name: 'Next month' })
    .click();
  await expect(demo.getByTestId('widget-timestamp')).not.toHaveText('0');
  for (const theme of ['dark', 'light']) {
    await demo.getByRole('switch', { name: 'Cycle widget theme' }).press('Space');
    await expect(demo.getByTestId('widget-theme')).toHaveText(theme);
  }
});
test('scalar dropdown and calendar preserve reactive forms values', async ({
  page,
}) => {
  const demo = page.locator('#migration-widgets-demo'),
    dropdown = demo.locator('#widget-id');
  await dropdown.getByRole('combobox').click();
  await dropdown.getByRole('option').filter({ hasText: 'Second' }).click();
  await expect(demo.getByTestId('widget-scalar')).toHaveText('2');
  await demo.locator('bulud-datepicker').getByRole('button').click();
  const day = demo
    .locator('bulud-datepicker .bulud-datepicker__day')
    .filter({ hasText: /^\s*15\s*$/ })
    .first();
  await day.click();
  await expect(demo.getByTestId('widget-date-value')).not.toHaveText('');
});
test('upload preview clears, interactive cards navigate once and tooltip restores anchor focus', async ({
  page,
}) => {
  const demo = page.locator('#migration-widgets-demo');
  await demo.locator('bulud-account-card').first().getByRole('button').focus();
  await page.keyboard.press('Enter');
  await expect(demo.getByTestId('widget-route')).toHaveText('MT/42');
  await demo.getByLabel('Disable wallet').check();
  await expect(demo.locator('bulud-account-card').nth(1)).toContainText(
    'Disabled',
  );
  await demo.locator('input[type=file]').setInputFiles({
    name: 'project.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('a,b\n1,2'),
  });
  await expect(demo.getByTestId('widget-files')).toHaveText('1');
  await expect(demo.locator('bulud-file-upload[presentation=preview]')).toContainText(
    'project.csv',
  );
  await demo
    .locator('bulud-file-upload[presentation=preview]')
    .getByRole('button', { name: 'Remove file' })
    .click();
  await expect(demo.getByTestId('widget-files')).toHaveText('0');
  const trigger = demo.getByRole('button', { name: 'Rich details' });
  await trigger.click();
  await expect(demo.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(demo.getByRole('tooltip')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test('deferred default illustration and configurable action work on mobile and desktop', async ({
  page,
}) => {
  const demo = page.locator('#migration-widgets-demo');
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await demo
      .getByRole('button', { name: 'Show default missing page' })
      .click();
    const state = page.locator('bulud-empty-state[variant=illustrated]');
    await expect(
      state.getByRole('heading', { name: 'Project missing page' }),
    ).toBeVisible();
    const image = state.locator('bulud-default-404-image img:visible');
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAttribute('src', /^data:image\/webp;base64,/);
    await expect(image).toHaveJSProperty('complete', true);
    await state.getByRole('button', { name: 'Return to widgets' }).click();
    await expect(state).toHaveCount(0);
  }
});
