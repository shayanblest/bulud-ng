import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('dismisses once with pointer, Enter and Space and restores focus', async ({
  page,
}) => {
  const scope = page.locator('#badge-states');
  const restore = scope.getByRole('button', { name: 'Restore badge' });
  for (const [index, key] of ['Enter', 'Space', 'pointer'].entries()) {
    await restore.click();
    const dismiss = scope.getByRole('button', {
      name: 'Remove published status',
    });
    await expect(dismiss).toBeVisible();
    await restore.focus();
    await page.keyboard.press('Tab');
    await expect(dismiss).toBeFocused();
    await expect(dismiss).toHaveCSS('outline-style', 'solid');
    await expect(dismiss).toHaveCSS('outline-width', '2px');
    await dismiss.hover();
    await expect(dismiss).toHaveCSS(
      'background-color',
      'rgba(15, 23, 42, 0.1)',
    );
    if (key === 'pointer') await dismiss.click();
    else await page.keyboard.press(key);
    await expect(scope.locator('#badge-removable')).toHaveCount(0);
    await expect(restore).toBeFocused();
    await expect(scope.locator('#badge-dismiss-count')).toHaveText(
      `Dismissals: ${index + 1}`,
    );
  }
});

test('covers variants, sizes, passive empty/text semantics, dots, RTL and theme precedence', async ({
  page,
}) => {
  const scope = page.locator('#badge-states');
  for (const [size, height] of [
    ['small', '26px'],
    ['medium', '32px'],
    ['large', '36px'],
  ]) {
    await expect(scope.locator(`.bulud-badge--${size}`).first()).toHaveCSS(
      'min-height',
      height,
    );
  }
  await expect(scope.locator('#badge-empty .bulud-badge__content')).toBeEmpty();
  await expect(scope.getByText('Available', { exact: true })).toHaveClass(
    'sr-only',
  );
  const host = scope.locator('#badge-default');
  const badge = host.locator('.bulud-badge');
  await expect(host).not.toHaveAttribute('role');
  await expect(host).not.toHaveAttribute('tabindex');
  await expect(badge).toHaveCSS('direction', 'rtl');
  await page.locator('header button').first().click();
  await expect(badge).toHaveCSS('direction', 'ltr');
  for (const variant of [
    'neutral',
    'primary',
    'success',
    'warning',
    'danger',
  ]) {
    const dot = page
      .locator(`#badge .bulud-badge--${variant} .bulud-badge__dot`)
      .first();
    await expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(
      await dot.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe(await dot.evaluate((el) => getComputedStyle(el).color));
  }
  await expect(badge).toHaveCSS('background-color', 'rgb(248, 250, 252)');
  await scope.getByLabel('Dark badge theme').check();
  await expect(badge).toHaveCSS('background-color', 'rgb(30, 41, 59)');
  await expect(scope.getByText('Instance theme', { exact: true })).toHaveCSS(
    'color',
    'rgb(255, 255, 255)',
  );
  await scope.evaluate((el) =>
    el.style.setProperty('--bulud-badge-neutral-background', '#123456'),
  );
  await expect(badge).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await host.evaluate((el) =>
    el.style.setProperty('--bulud-badge-neutral-background', '#234567'),
  );
  await expect(badge).toHaveCSS('background-color', 'rgb(35, 69, 103)');
  await host.evaluate((el) =>
    el.style.removeProperty('--bulud-badge-neutral-background'),
  );
  await scope.evaluate((el) =>
    el.style.removeProperty('--bulud-badge-neutral-background'),
  );
  await scope.getByLabel('Dark badge theme').uncheck();
  await expect(badge).toHaveCSS('background-color', 'rgb(248, 250, 252)');
});

for (const marker of ['class', 'data-theme'] as const) {
  test(`all variants inherit dark ${marker} colors and accept instance overrides`, async ({
    page,
  }) => {
    const scope = page.locator('#badge');
    await scope.evaluate((el, attr) => el.setAttribute(attr, 'dark'), marker);
    for (const [variant, color] of [
      ['neutral', 'rgb(30, 41, 59)'],
      ['primary', 'rgb(30, 58, 138)'],
      ['success', 'rgb(20, 83, 45)'],
      ['warning', 'rgb(120, 53, 15)'],
      ['danger', 'rgb(136, 19, 55)'],
    ]) {
      const badge = scope.locator(`.bulud-badge--${variant}`).first();
      await expect(badge).toHaveCSS('background-color', color);
      await badge
        .locator('..')
        .evaluate(
          (el, v) =>
            el.style.setProperty(`--bulud-badge-${v}-background`, '#123456'),
          variant,
        );
      await expect(badge).toHaveCSS('background-color', 'rgb(18, 52, 86)');
    }
  });
}

test('CSS geometry and focus overrides inherit and yield to instance values', async ({
  page,
}) => {
  const scope = page.locator('#badge-states');
  const host = scope.locator('#badge-removable');
  const button = host.locator('button');
  await scope.evaluate((el) => {
    el.style.setProperty('--bulud-badge-dismiss-size', '32px');
    el.style.setProperty('--bulud-badge-focus-width', '4px');
    el.style.setProperty('--bulud-badge-focus-offset', '3px');
    el.style.setProperty('--bulud-badge-focus', '#123456');
    el.style.setProperty('--bulud-badge-dismiss-hover-background', '#234567');
  });
  await scope.getByRole('button', { name: 'Restore badge' }).focus();
  await page.keyboard.press('Tab');
  await expect(button).toHaveCSS('min-width', '32px');
  await expect(button).toHaveCSS('outline-width', '4px');
  await expect(button).toHaveCSS('outline-offset', '3px');
  await expect(button).toHaveCSS('outline-color', 'rgb(18, 52, 86)');
  await button.hover();
  await expect(button).toHaveCSS('background-color', 'rgb(35, 69, 103)');
  await host.evaluate((el) =>
    el.style.setProperty('--bulud-badge-dismiss-size', '36px'),
  );
  await expect(button).toHaveCSS('min-width', '36px');
});
