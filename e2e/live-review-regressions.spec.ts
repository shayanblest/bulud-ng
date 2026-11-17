import { expect, test } from '@playwright/test';

test('formatted file sizes keep sign and units in visual reading order in both directions', async ({
  page,
}) => {
  await page.goto('/#file-size');
  for (const direction of ['rtl', 'ltr']) {
    await page
      .locator('#file-size')
      .evaluate((el, dir) => el.setAttribute('dir', dir), direction);
    await expect(page.locator('#filesize-negative')).toHaveText('-1.54 kB');
    await expect(page.locator('#filesize-negative')).toHaveCSS(
      'direction',
      'ltr',
    );
  }
});

test('projected workflow preserves dotted connectors and completed/current/upcoming states', async ({
  page,
}) => {
  await page.goto('/#migration-primitives-demo');
  const demo = page.locator('#migration-primitives-demo'),
    stepper = demo.locator('bulud-stepper'),
    connectors = stepper.locator('.bulud-step-connector'),
    steps = stepper.locator('.bulud-step');
  await expect(connectors).toHaveCount(2);
  await expect(connectors.first()).toHaveCSS('border-bottom-style', 'dotted');
  await expect(connectors.first()).toHaveCSS('border-bottom-width', '2px');
  expect((await connectors.first().boundingBox())!.width).toBeGreaterThan(20);
  const initial = await connectors
    .first()
    .evaluate((el) => getComputedStyle(el).color);
  await demo.getByRole('button', { name: 'Next workflow step' }).click();
  await expect(steps.nth(0)).toHaveClass(/previous/);
  await expect(steps.nth(1)).toHaveClass(/current/);
  await expect(steps.nth(2)).toHaveClass(/next/);
  await expect(steps.nth(0).locator('.step-thumb svg')).toHaveCount(1);
  expect(
    await connectors.first().evaluate((el) => getComputedStyle(el).color),
  ).not.toBe(initial);
  await expect(connectors.nth(1)).toHaveCSS('color', initial);
});

test('appended loaders have logical spacing in RTL and LTR and accept a project gap', async ({
  page,
}) => {
  await page.goto('/#migration-primitives-demo');
  const demo = page.locator('#migration-primitives-demo'),
    button = demo.getByRole('button', { name: 'Toggle button loader' });
  await button.click();
  const loader = button.locator('.bulud-button-loader__spinner');
  for (const direction of ['rtl', 'ltr']) {
    await demo.evaluate((el, dir) => el.setAttribute('dir', dir), direction);
    await expect(loader).toHaveCSS('margin-inline-start', '8px');
  }
  await button.evaluate((el) =>
    el.style.setProperty('--bulud-button-loader-gap', '16px'),
  );
  await expect(loader).toHaveCSS('margin-inline-start', '16px');
});

test('theme uses a real switch, dark actions remain readable and language selection has one indicator', async ({
  page,
}) => {
  await page.goto('/#migration-widgets-demo');
  const demo = page.locator('#migration-widgets-demo');
  await demo.getByRole('switch', { name: 'Cycle widget theme' }).press('Space');
  await expect(demo).toHaveAttribute('data-theme', 'dark');
  await expect(
    demo.locator('bulud-account-card').first().locator('.platform-card'),
  ).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(
    demo
      .locator('bulud-account-card')
      .first()
      .locator('.bulud-color-on-accent')
      .first(),
  ).toHaveCSS('color', 'rgb(255, 255, 255)');
  const button = demo.getByRole('button', { name: 'Add widget language' });
  const colors = await button.evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, background: s.backgroundColor };
  });
  expect(colors.color).not.toBe('rgb(12, 35, 64)');
  const language = demo.locator('bulud-language-switch');
  await language.getByRole('combobox').click();
  await expect(language.locator('input[type=radio]')).toHaveCount(0);
  await expect(language.getByRole('listbox')).toHaveCSS(
    'scrollbar-width',
    'none',
  );
  await language.getByRole('option').filter({ hasText: 'فارسی' }).click();
  await expect(demo).toHaveAttribute('dir', 'rtl');
  await expect(demo.getByRole('heading').first()).toContainText('کامپوننت');
});

test('card defaults retain original gradients, and another project can override them', async ({
  page,
}) => {
  await page.goto('/#migration-widgets-demo');
  const demo = page.locator('#migration-widgets-demo'),
    card = demo.locator('bulud-account-card').first();
  await expect(card.locator('.card-platform')).toHaveCSS(
    'background-image',
    /linear-gradient\(rgb\(12, 35, 64\).*rgb\(67, 97, 135\)/,
  );
  await expect(card.locator('.head')).toHaveCSS(
    'background-image',
    /radial-gradient/,
  );
  await demo.getByLabel('Card background', { exact: true }).evaluate((el) => {
    (el as HTMLInputElement).value = '#663399';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(card.locator('.platform-card')).toHaveCSS(
    'background-color',
    'rgb(102, 51, 153)',
  );
});

test('all new demo sections fit mobile and desktop and use project surfaces', async ({
  page,
}) => {
  await page.goto('/#all');
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of [
      'line-chart-demo',
      'radial-chart-demo',
      'migration-primitives-demo',
      'migration-widgets-demo',
    ]) {
      const demo = page.locator('#' + id);
      await demo.scrollIntoViewIfNeeded();
      await expect(demo).toHaveAttribute('data-bulud-preset', 'angour');
      expect((await demo.boundingBox())!.width).toBeLessThanOrEqual(width);
      await expect(demo).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    }
  }
  await page.locator('#migration-primitives-demo').screenshot({
    path: '/tmp/angour-compatible-migration/review-workflow-desktop.png',
  });
  await page.locator('#migration-widgets-demo').screenshot({
    path: '/tmp/angour-compatible-migration/review-widgets-desktop.png',
  });
});

test('month picker and canonical checkbox remain legible and keyboard operable in light and dark RTL/LTR', async ({
  page,
}) => {
  await page.goto('/#migration-widgets-demo');
  const demo = page.locator('#migration-widgets-demo'),
    picker = demo.locator('bulud-period-picker[presentation=grid]'),
    box = demo.getByRole('checkbox', { name: 'Override month theme' });
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark')
      await demo
        .getByRole('switch', { name: 'Cycle widget theme' })
        .press('Space');
    for (const dir of ['ltr', 'rtl']) {
      await demo.evaluate((el, value) => el.setAttribute('dir', value), dir);
      const display = picker.locator('.display');
      await expect(display).toHaveCSS('border-width', '1px');
      await expect(display).toHaveCSS(
        'color',
        theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
      );
      await expect(display).toHaveCSS(
        'background-color',
        theme === 'dark' ? 'rgb(52, 52, 60)' : 'rgb(243, 246, 249)',
      );
      await display.click();
      await expect(picker.locator('.month-picker')).toBeVisible();
      await expect(picker.locator('.year')).toHaveCSS(
        'color',
        theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
      );
      await picker.getByRole('button', { name: 'Jun', exact: true }).click();
      await expect(box).toHaveCSS('appearance', 'none');
      await expect(box).toHaveCSS('width', '16px');
      await expect(box).toHaveCSS('border-radius', '4px');
      await box.focus();
      await box.press('Space');
      await expect(box).toBeChecked();
      await expect(box).toHaveCSS(
        'background-color',
        theme === 'dark' ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)',
      );
      await box.press('Space');
      await expect(box).not.toBeChecked();
    }
    await demo
      .locator('.demo-widget-panel')
      .first()
      .screenshot({
        path:
          '/tmp/angour-compatible-migration/calendar-checkbox-' +
          theme +
          '.png',
      });
  }
});

test('all new checkboxes use the canonical component and badge radios retain keyboard selection', async ({
  page,
}) => {
  await page.goto('/#migration-primitives-demo');
  const demo = page.locator('#migration-primitives-demo');
  await expect(demo.locator('bulud-checkbox')).toHaveCount(6);
  await expect(demo.getByRole('checkbox', { name: 'Disable OTP' })).toHaveCSS(
    'appearance',
    'none',
  );
  await demo.getByRole('checkbox', { name: 'Disable OTP' }).check();
  await expect(demo.locator('bulud-otp input').first()).toBeDisabled();
  const group = page.getByRole('radiogroup', {
    name: 'Dismissible badge size',
  });
  await group.scrollIntoViewIfNeeded();
  const radio = group.getByRole('radio', { name: 'medium' });
  await expect(radio).toHaveCSS('appearance', 'none');
  await expect(radio).toHaveCSS('width', '16px');
  for (const direction of ['ltr', 'rtl']) {
    await group.evaluate(
      (el, value) => el.setAttribute('dir', value),
      direction,
    );
    await radio.check();
    await radio.focus();
    await radio.press(direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
    await expect(group.getByRole('radio', { name: 'large' })).toBeChecked();
  }
});
