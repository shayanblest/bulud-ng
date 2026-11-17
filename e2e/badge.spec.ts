import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#all');
});

for (const direction of ['rtl', 'ltr'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`dismisses every size with pointer, Enter and Space and restores focus in ${theme} ${direction}`, async ({
      page,
    }) => {
      const scope = page.locator('#badge-states');
      if (direction === 'ltr') {
        await page.locator('#demo-language-toggle').click();
      }
      if (theme === 'dark') {
        await scope.getByLabel('Dark badge theme').check();
      }
      const restore = scope.getByRole('button', { name: 'Restore badge' });
      const host = scope.locator('#badge-removable');
      const badge = host.locator('.bulud-badge');
      const dismiss = scope.getByRole('button', {
        name: 'Remove published status',
      });
      let dismissals = 0;
      for (const [size, height] of [
        ['small', '20px'],
        ['medium', '24px'],
        ['large', '28px'],
      ]) {
        await restore.click();
        const sizeControl = scope
          .getByRole('radiogroup', { name: 'Dismissible badge size' })
          .getByRole('radio', { name: size, exact: true });
        await sizeControl.check();
        await expect(sizeControl).toBeChecked();
        await expect(badge).toHaveCSS('min-height', height);
        for (const key of ['Enter', 'Space', 'pointer']) {
          await restore.click();
          await expect(dismiss).toHaveAttribute('type', 'button');
          await expect(badge).toHaveCSS('direction', direction);
          await expect(badge).toHaveCSS('min-height', height);
          await expect(badge).toHaveCSS(
            'background-color',
            theme === 'dark' ? 'rgb(52, 52, 60)' : 'rgb(243, 246, 249)',
          );
          const dismissBox = await dismiss.boundingBox();
          const contentBox = await host
            .locator('.bulud-badge__content')
            .boundingBox();
          expect(dismissBox).not.toBeNull();
          expect(contentBox).not.toBeNull();
          expect(dismissBox!.x < contentBox!.x).toBe(direction === 'rtl');
          await restore.focus();
          await page.keyboard.press('Tab');
          await expect(dismiss).toBeFocused();
          await expect(dismiss).toHaveCSS('outline-style', 'solid');
          await expect(dismiss).toHaveCSS('outline-width', '2px');
          await expect(dismiss).toHaveCSS('outline-offset', '2px');
          await expect(dismiss).toHaveCSS(
            'outline-color',
            await badge.evaluate((el) => getComputedStyle(el).color),
          );
          await dismiss.hover();
          await expect(dismiss).toHaveCSS(
            'background-color',
            theme === 'dark'
              ? 'rgba(213, 213, 213, 0.15)'
              : 'rgba(30, 30, 38, 0.15)',
          );
          if (key === 'pointer') await dismiss.click();
          else await page.keyboard.press(key);
          await expect(host).toHaveCount(0);
          await expect(restore).toBeFocused();
          await expect(scope.locator('#badge-dismiss-count')).toHaveText(
            `Dismissals: ${++dismissals}`,
          );
        }
      }
    });
  }
}

test('covers variants, sizes, passive empty/text semantics, dots, RTL and theme precedence', async ({
  page,
}) => {
  const scope = page.locator('#badge-states');
  for (const [size, height] of [
    ['small', '20px'],
    ['medium', '24px'],
    ['large', '28px'],
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
  await expect(badge).toHaveCSS('background-color', 'rgb(243, 246, 249)');
  await scope.getByLabel('Dark badge theme').check();
  await expect(badge).toHaveCSS('background-color', 'rgb(52, 52, 60)');
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
  await expect(badge).toHaveCSS('background-color', 'rgb(243, 246, 249)');
});

for (const marker of ['class', 'data-theme'] as const) {
  test(`all variants inherit dark ${marker} colors and accept instance overrides`, async ({
    page,
  }) => {
    const scope = page.locator('#badge');
    if (marker === 'class') {
      await scope.getByLabel('Dark badge theme').check();
    } else {
      await scope.evaluate((el) => el.setAttribute('data-theme', 'dark'));
    }
    for (const [variant, color] of [
      ['neutral', 'rgb(52, 52, 60)'],
      ['primary', 'rgb(253, 181, 21)'],
      ['success', 'rgb(38, 208, 124)'],
      ['warning', 'rgb(255, 204, 25)'],
      ['danger', 'rgb(255, 128, 128)'],
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
  await expect(button).toHaveCSS('min-width', '24px');
  await page.addStyleTag({
    content: ':root { --bulud-badge-dismiss-size: 28px; }',
  });
  await expect(button).toHaveCSS('min-width', '28px');
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
    el.style.setProperty('--bulud-badge-dismiss-size', '28px'),
  );
  await expect(button).toHaveCSS('min-width', '28px');
});
