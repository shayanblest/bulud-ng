import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#all');
});

test('native keyboard, pointer, disabled, loading recovery, and form behavior', async ({
  page,
}) => {
  const section = page.locator('#button-interactions');
  const action = section.locator('#button-dynamic button');
  const count = section.locator('#button-count');
  await section.getByLabel('Dark button theme').focus();
  await page.keyboard.press('Tab');
  await expect(action).toBeFocused();
  await expect(action).toHaveCSS('outline-style', 'solid');
  await expect(action).toHaveCSS('outline-width', '3px');
  await page.keyboard.press('Enter');
  await expect(count).toHaveText('Actions: 1');
  await page.keyboard.press('Space');
  await expect(count).toHaveText('Actions: 2');
  await action.click();
  await expect(count).toHaveText('Actions: 3');
  await section.getByLabel('Disable action').check();
  await expect(action).toBeDisabled();
  await action.click({ force: true });
  await expect(count).toHaveText('Actions: 3');
  await section.getByLabel('Dark button theme').focus();
  await page.keyboard.press('Tab');
  await expect(
    section.getByRole('button', { name: 'Empty content action' }),
  ).toBeFocused();
  await section.getByLabel('Loading action').check();
  await expect(action).toHaveAttribute('aria-busy', 'true');
  await expect(section.locator('#button-dynamic [role="status"]')).toHaveText(
    'Saving changes',
  );
  await expect(action).toHaveAccessibleName('Save changes');
  await section.getByLabel('Disable action').uncheck();
  await expect(action).toBeDisabled();
  await section.getByLabel('Loading action').uncheck();
  await expect(action).toBeEnabled();
  await expect(action).not.toHaveAttribute('aria-busy');
  await expect(section.locator('#button-dynamic [role="status"]')).toBeEmpty();
  await action.click();
  await expect(count).toHaveText('Actions: 4');
  await section.getByLabel('Example value').fill('Changed');
  await section.getByRole('button', { name: 'Reset example' }).click();
  await expect(section.getByLabel('Example value')).toHaveValue('Initial');
  await section.getByRole('button', { name: 'Submit example' }).press('Enter');
  await expect(count).toHaveText('Actions: 5');
});

test('variant hover and active colors, sizes, RTL, dark theme and override precedence', async ({
  page,
}) => {
  const variants = [
    ['primary', 'rgb(12, 35, 64)', 'rgb(11, 32, 58)', 'rgb(10, 28, 51)'],
    [
      'secondary',
      'rgb(253, 181, 21)',
      'rgb(228, 163, 19)',
      'rgb(202, 145, 17)',
    ],
    ['danger', 'rgb(161, 23, 41)', 'rgb(145, 21, 37)', 'rgb(129, 18, 33)'],
    ['ghost', 'rgba(0, 0, 0, 0)', 'rgb(243, 246, 249)', 'rgb(229, 233, 237)'],
  ];
  for (const [variant, background, hover, active] of variants) {
    const button = page.locator(`#variants .bulud-button--${variant}`);
    await expect(button).toHaveCSS('background-color', background);
    await button.hover();
    await expect(button).toHaveCSS('background-color', hover);
    await page.mouse.down();
    await expect(button).toHaveCSS('background-color', active);
    await page.mouse.up();
    await page.mouse.move(0, 0);
  }
  for (const [size, height] of [
    ['small', '32px'],
    ['medium', '40px'],
    ['large', '48px'],
  ]) {
    await expect(page.locator(`.bulud-button--${size}`).first()).toHaveCSS(
      'height',
      height,
    );
  }
  const section = page.locator('#button-interactions');
  const host = section.locator('#button-dynamic');
  const button = host.locator('button');
  await expect(button).toHaveCSS('direction', 'rtl');
  await page.locator('header button').first().click();
  await expect(button).toHaveCSS('direction', 'ltr');
  await section.getByLabel('Dark button theme').check();
  await expect(button).toHaveCSS('background-color', 'rgb(253, 181, 21)');
  await expect(
    section.getByRole('button', { name: 'Instance theme' }),
  ).toHaveCSS('background-color', 'rgb(253, 181, 21)');
  await section.getByLabel('Dark button theme').uncheck();
  await expect(button).toHaveCSS('background-color', 'rgb(12, 35, 64)');
  await section.evaluate((element) =>
    element.style.setProperty('--bulud-button-background', '#123456'),
  );
  await expect(button).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await host.evaluate((element) =>
    element.style.setProperty('--bulud-button-background', '#234567'),
  );
  await expect(button).toHaveCSS('background-color', 'rgb(35, 69, 103)');
  await section.getByLabel('Disable action').check();
  await button.hover({ force: true });
  await expect(button).toHaveCSS('background-color', 'rgba(30, 30, 38, 0.15)');
  await host.evaluate((element) =>
    element.style.setProperty('--bulud-button-disabled-background', '#345678'),
  );
  await expect(button).toHaveCSS('background-color', 'rgb(52, 86, 120)');
  await expect(button).toHaveCSS('opacity', '1');
});

test('full width, focus overrides, and reduced motion', async ({ page }) => {
  const section = page.locator('#button-interactions');
  const host = section.locator('#button-dynamic');
  const button = host.locator('button');
  await section.evaluate((element) => {
    element.style.setProperty('--bulud-button-border-width', '2px');
    element.style.setProperty('--bulud-button-focus-width', '4px');
    element.style.setProperty('--bulud-button-focus-offset', '3px');
  });
  await section.getByLabel('Dark button theme').focus();
  await page.keyboard.press('Tab');
  await expect(button).toHaveCSS('border-top-width', '2px');
  await expect(button).toHaveCSS('outline-width', '4px');
  await expect(button).toHaveCSS('outline-offset', '3px');
  const ghost = page.locator('#variants .bulud-button--ghost');
  await page
    .locator('#variants')
    .evaluate((element) =>
      element.style.setProperty('--bulud-button-ghost-background', '#123456'),
    );
  await expect(ghost).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await ghost
    .locator('..')
    .evaluate((element) =>
      element.style.setProperty('--bulud-button-ghost-background', '#234567'),
    );
  await expect(ghost).toHaveCSS('background-color', 'rgb(35, 69, 103)');
  await host.evaluate((element) => {
    element.style.setProperty('--bulud-button-border-width', '3px');
    element.style.setProperty('--bulud-button-focus-width', '5px');
    element.style.setProperty('--bulud-button-focus-offset', '4px');
    element.style.setProperty('--bulud-button-focus-ring', '#123456');
  });
  await section.getByLabel('Dark button theme').focus();
  await page.keyboard.press('Tab');
  await expect(button).toHaveCSS('border-top-width', '3px');
  await expect(button).toHaveCSS('outline-width', '5px');
  await expect(button).toHaveCSS('outline-offset', '4px');
  await expect(button).toHaveCSS('outline-color', 'rgb(18, 52, 86)');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await section.getByLabel('Loading action').check();
  await expect(button.locator('.bulud-button__spinner')).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(button).toHaveCSS('transition-duration', '0s');
  const fullWidth = page.locator('#variants bulud-button').first();
  const bounds = await fullWidth.boundingBox();
  const buttonBounds = await fullWidth.locator('button').boundingBox();
  expect(bounds?.width).toBe(buttonBounds?.width);
});

test('root CSS overrides omitted button tokens with unrelated typed theme configuration', async ({
  page,
}) => {
  // The demo uses the imported default design; omitted provider tokens stay CSS-overridable.
  const providerStyle = page.locator('style[data-bulud-theme]');
  await expect(providerStyle).toHaveCount(1);
  await expect
    .poll(() => providerStyle.textContent())
    .not.toContain('--bulud-color-primary:');
  for (const token of [
    'border-width',
    'focus-width',
    'focus-offset',
    'ghost-background',
  ]) {
    await expect
      .poll(() => providerStyle.textContent())
      .not.toContain(`--bulud-button-${token}:`);
  }
  await page.addStyleTag({
    content: `:root {
    --bulud-button-border-width: 2px;
    --bulud-button-focus-width: 4px;
    --bulud-button-focus-offset: 3px;
    --bulud-button-ghost-background: #123456;
  }`,
  });
  const section = page.locator('#button-interactions');
  await section.getByLabel('Dark button theme').focus();
  await page.keyboard.press('Tab');
  const button = section.locator('#button-dynamic button');
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS('border-top-width', '2px');
  await expect(button).toHaveCSS('outline-width', '4px');
  await expect(button).toHaveCSS('outline-offset', '3px');
  await expect(page.locator('#variants .bulud-button--ghost')).toHaveCSS(
    'background-color',
    'rgb(18, 52, 86)',
  );
});

for (const marker of ['class', 'data-theme'] as const) {
  test(`nested dark ${marker} resets an explicit global ghost background`, async ({
    page,
  }) => {
    // Provider integration is covered in the browser unit tests. Add the
    // explicit token to the demo's existing provider rule to test its cascade.
    await page.locator('style[data-bulud-theme]').evaluate((element) => {
      element.textContent = element.textContent!.replace(
        '}',
        '--bulud-button-ghost-background: #123456; }',
      );
    });
    const scope = page.locator('#variants');
    const button = scope.locator('.bulud-button--ghost');
    const host = button.locator('..');
    await expect(button).toHaveCSS('background-color', 'rgb(18, 52, 86)');
    await scope.evaluate(
      (element, attribute) => element.setAttribute(attribute, 'dark'),
      marker,
    );
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await scope.evaluate((element) =>
      element.style.setProperty('--bulud-button-ghost-background', '#234567'),
    );
    await expect(button).toHaveCSS('background-color', 'rgb(35, 69, 103)');
    await host.evaluate((element) =>
      element.style.setProperty('--bulud-button-ghost-background', '#345678'),
    );
    await expect(button).toHaveCSS('background-color', 'rgb(52, 86, 120)');
    await host.evaluate((element) =>
      element.style.removeProperty('--bulud-button-ghost-background'),
    );
    await scope.evaluate((element) =>
      element.style.removeProperty('--bulud-button-ghost-background'),
    );
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await scope.evaluate(
      (element, attribute) => element.removeAttribute(attribute),
      marker,
    );
    await expect(button).toHaveCSS('background-color', 'rgb(18, 52, 86)');
    await page
      .locator('html')
      .evaluate(
        (element, attribute) => element.setAttribute(attribute, 'dark'),
        marker,
      );
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });
}

test('project-owned marketing IDs remain exact and reactive on the native action', async ({
  page,
}) => {
  const section = page.locator('#button-interactions');
  const input = section.getByLabel('Marketing ID', { exact: true });
  for (const id of [
    'sign_in_submit',
    'dashboard_real_create_link_button',
    'cancel-42-btn',
  ]) {
    await input.fill(id);
    const action = section.locator('button[id="' + id + '"]');
    await expect(action).toHaveCount(1);
    await expect(page.locator('[id="' + id + '"]')).toHaveCount(1);
    await action.press('Enter');
  }
  await expect(section.locator('#button-count')).toHaveText('Actions: 3');
  await section.getByLabel('Dark button theme').check();
  await page.locator('header button').first().click();
  await expect(section.locator('#cancel-42-btn')).toHaveAccessibleName(
    'Save changes',
  );
  await input.fill('');
  await expect(section.locator('#button-dynamic button')).not.toHaveAttribute(
    'id',
  );
  await expect(section.locator('#button-dynamic')).toHaveCount(1);
});

test('primary outline follows Angour light/dark colors, hover and project overrides', async ({
  page,
}) => {
  const section = page.locator('#button-interactions');
  const button = section.getByRole('button', {
    name: 'Submit example',
    exact: true,
  });
  for (const dark of [false, true]) {
    await section.getByLabel('Dark button theme').setChecked(dark);
    await page.mouse.move(0, 0);
    const color = dark ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)';
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(button).toHaveCSS('color', color);
    await expect(button).toHaveCSS('border-top-color', color);
    await expect(button).toHaveCSS('border-top-width', '1px');
    await button.hover();
    await expect(button).toHaveCSS(
      'background-color',
      dark ? 'rgba(213, 213, 213, 0.15)' : 'rgba(30, 30, 38, 0.15)',
    );
    await button.press('Enter');
  }
  await section.evaluate((el) =>
    el.style.setProperty('--bulud-button-outline-foreground', '#abcdef'),
  );
  await expect(button).toHaveCSS('color', 'rgb(171, 205, 239)');
  await expect(section.locator('#button-count')).toHaveText('Actions: 2');
});

test('link button keeps native action semantics and Angour colors in both themes', async ({
  page,
}) => {
  const section = page.locator('#button-interactions');
  const action = section.getByRole('button', {
    name: 'Link action',
    exact: true,
  });
  for (const dark of [false, true]) {
    await section.getByLabel('Dark button theme').setChecked(dark);
    await page.mouse.move(0, 0);
    await expect(action).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(action).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
    await expect(action).toHaveCSS(
      'color',
      dark ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)',
    );
    await action.hover();
    await expect(action).toHaveCSS(
      'background-color',
      dark ? 'rgba(213, 213, 213, 0.15)' : 'rgba(30, 30, 38, 0.15)',
    );
    await action.press('Enter');
  }
  await expect(section.locator('#button-count')).toHaveText('Actions: 2');
  await expect(action).toHaveAttribute('id', 'demo_link_action');
});
