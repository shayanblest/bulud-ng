import { expect, test, type Locator } from '@playwright/test';
async function choose(demo: Locator, label: string, value: string) {
  await demo.getByRole('combobox', { name: label }).click();
  await demo.getByRole('option', { name: value, exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/#migration-primitives-demo');
  await expect(page.locator('#migration-primitives-demo')).toBeVisible();
});
test('dynamic languages, two lengths, invalid/disabled/unstyled states and live theme overrides', async ({
  page,
}) => {
  const demo = page.locator('#migration-primitives-demo'),
    otp = demo.locator('bulud-otp'),
    inputs = otp.locator('input');
  for (const language of ['en', 'fa', 'ar', 'tr']) {
    await choose(demo, 'Migration language', language);
    await expect(demo).toHaveAttribute(
      'dir',
      ['fa', 'ar'].includes(language) ? 'rtl' : 'ltr',
    );
    await expect(inputs).toHaveCount(4);
  }
  await demo.getByRole('button', { name: 'Add project language' }).click();
  await expect(
    demo.getByRole('combobox', { name: 'Migration language' }),
  ).toContainText('de');
  await expect(otp.getByRole('group')).toHaveAttribute(
    'aria-label',
    'Bestätigungscode',
  );
  await choose(demo, 'OTP length', '6');
  await expect(inputs).toHaveCount(6);
  await demo.getByLabel('Invalid OTP', { exact: true }).check();
  await expect(inputs.first()).toHaveAttribute('aria-invalid', 'true');
  await demo.getByLabel('Invalid OTP', { exact: true }).uncheck();
  await demo.getByLabel('Disable OTP').check();
  for (const input of await inputs.all()) await expect(input).toBeDisabled();
  await demo.getByLabel('Disable OTP').uncheck();
  await expect(inputs.first()).toBeEnabled();
  await demo.getByLabel('Unstyled OTP').check();
  await expect(otp).toHaveClass(/unstyled/);
  await demo.getByLabel('Unstyled OTP').uncheck();
  await demo.getByLabel('Instance theme override').check();
  await expect(inputs.first()).toHaveCSS('border-color', 'rgb(190, 40, 90)');
  for (const theme of ['dark', 'light']) {
    await demo
      .getByRole('switch', { name: 'Cycle migration theme' })
      .press('Space');
    await expect(demo.getByTestId('theme-name')).toHaveText(theme);
  }
  await page.setViewportSize({ width: 375, height: 900 });
  const bounds = await otp.boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(375);
});
test('separate OTP inputs preserve pointer/keyboard/paste/form behavior', async ({
  page,
}) => {
  const demo = page.locator('#migration-primitives-demo'),
    inputs = demo.locator('bulud-otp input');
  await inputs.first().fill('1');
  await expect(inputs.nth(1)).toBeFocused();
  await inputs.nth(1).fill('2');
  await inputs.nth(2).fill('3');
  await inputs.nth(3).fill('4');
  await expect(demo.getByTestId('otp-value')).toHaveText('1234');
  await expect(demo.getByTestId('otp-completed')).toHaveText('1234');
  await inputs.nth(3).press('Backspace');
  await expect(demo.getByTestId('otp-value')).toHaveText('123');
  await inputs.nth(3).press('Backspace');
  await expect(inputs.nth(2)).toBeFocused();
  await expect(demo.getByTestId('otp-value')).toHaveText('12');
  await demo.getByRole('button', { name: 'Clear OTP' }).click();
  await inputs.first().focus();
  await inputs.first().evaluate((el) => {
    const data = new DataTransfer();
    data.setData('text', '۱۲٣۴');
    el.dispatchEvent(
      new ClipboardEvent('paste', {
        clipboardData: data,
        cancelable: true,
        bubbles: true,
      }),
    );
  });
  await expect(demo.getByTestId('otp-value')).toHaveText('1234');
});
test('native input behaviors retain numeric CVA, keyboard conversion, mask and button content', async ({
  page,
}) => {
  const demo = page.locator('#migration-primitives-demo');
  await demo.getByLabel('Only numbers', { exact: true }).fill('12.345');
  await expect(demo.getByLabel('Only numbers', { exact: true })).toHaveValue(
    '12.34',
  );
  await demo.getByLabel('Grouped number').fill('12345.67');
  await expect(demo.getByLabel('Grouped number')).toHaveValue('12,345.67');
  await expect(demo.getByTestId('grouped-value')).toHaveText('12345.67');
  await demo.getByLabel('Digit mask').fill('1234');
  await expect(demo.getByLabel('Digit mask')).toHaveValue('12-34');
  const length = demo.getByLabel('Maximum length');
  await length.fill('123');
  await length.press('4');
  await expect(length).toHaveValue('123');
  const filter = demo.getByLabel('Input filter', { exact: true });
  await filter.press('a');
  await expect(filter).toHaveValue('');
  await filter.press('A');
  await expect(filter).toHaveValue('A');
  const keyboard = demo.getByLabel('English keyboard', { exact: true });
  await keyboard.fill('ش۱a');
  await expect(keyboard).toHaveValue('A1A');
  await expect(demo.getByTestId('keyboard-value')).toHaveText('A1A');
  const button = demo.getByRole('button', { name: 'Toggle button loader' });
  await button.click();
  await expect(button.locator('i')).toHaveCount(1);
  await expect(button).toBeEnabled();
  await demo.getByLabel('Instance theme override').check();
  await expect(button.locator('i')).toHaveCSS('width', '32px');
  await button.click();
  await expect(button.locator('i')).toHaveCount(0);
});
test('permission rendering, repeated tab selection, missing selections and keyboard activation', async ({
  page,
}) => {
  const demo = page.locator('#migration-primitives-demo');
  await expect(demo.getByTestId('protected-content')).toBeVisible();
  await demo.getByLabel('Allow content', { exact: true }).uncheck();
  await expect(demo.getByTestId('protected-content')).toHaveCount(0);
  await demo.getByLabel('Allow content', { exact: true }).check();
  const tabs = demo.locator('bulud-tabs');
  await expect(tabs.getByRole('tabpanel')).toHaveCount(0);
  const first = tabs.getByRole('tab', { name: 'Overview', exact: true });
  await first.click();
  await first.click();
  await expect(demo.getByTestId('tab-events')).toHaveText('2');
  await expect(tabs.getByRole('tabpanel')).toHaveText('Overview panel');
  await first.focus();
  await first.press('End');
  const second = tabs.getByRole('tab', { name: 'Protected', exact: true });
  await expect(second).toBeFocused();
  await second.press('Enter');
  await expect(tabs.getByRole('tabpanel')).toHaveText('Protected panel');
  await demo.getByLabel('Show protected tab').uncheck();
  await expect(tabs.getByRole('tabpanel')).toHaveCount(0);
  await demo.getByRole('button', { name: 'Select missing tab' }).click();
  await expect(tabs.getByRole('tabpanel')).toHaveCount(0);
});
test('projected workflow classes and countdown stop do not leave active intervals', async ({
  page,
}) => {
  const demo = page.locator('#migration-primitives-demo'),
    stepper = demo.locator('bulud-stepper');
  await expect(
    stepper.locator('.bulud-step').filter({ hasText: 'Identity step' }),
  ).toHaveClass(/current/);
  await demo.getByRole('button', { name: 'Next workflow step' }).click();
  await expect(
    stepper.locator('.bulud-step').filter({ hasText: 'Address step' }),
  ).toHaveClass(/current/);
  await expect(
    stepper.locator('.bulud-step').filter({ hasText: 'Identity step' }),
  ).toHaveClass(/previous/);
  await demo.getByRole('button', { name: 'Previous workflow step' }).click();
  await expect(
    stepper.locator('.bulud-step').filter({ hasText: 'Identity step' }),
  ).toHaveClass(/current/);
  await demo.getByRole('button', { name: 'Start countdown' }).click();
  const timer = demo.getByRole('timer');
  await expect(timer).toHaveText(/01:0[12]/);
  await demo.getByRole('button', { name: 'Stop countdown' }).click();
  const stopped = await timer.textContent();
  await page.waitForTimeout(1200);
  await expect(timer).toHaveText(stopped!);
});

test('responsive carousel cards, native scroll dots and live RTL', async ({
  page,
}) => {
  const demo = page.locator('#migration-primitives-demo');
  await page.setViewportSize({ width: 1280, height: 900 });
  const multi = demo.locator('bulud-carousel[presentation=multi]');
  await expect(multi.locator('.itb-carousel__item')).toHaveCount(5);
  const widths = await multi
    .locator('.itb-carousel__item')
    .evaluateAll((items) =>
      items.map((item) => (item as HTMLElement).style.width),
    );
  expect(widths[0]).toBe('33.3333%');
  await multi.getByRole('button', { name: 'Next slide' }).click();
  await expect(multi.locator('.itb-carousel__wrapper')).toHaveCSS(
    'transform',
    /matrix/,
  );
  await page.setViewportSize({ width: 375, height: 900 });
  await expect(multi.locator('.itb-carousel__item').first()).toHaveCSS(
    'width',
    await multi
      .locator('.itb-carousel__viewport')
      .evaluate((el) => getComputedStyle(el).width),
  );
  await choose(demo, 'Migration language', 'fa');
  await expect(multi).toHaveAttribute('dir', 'rtl');
  const scroll = demo.locator('bulud-carousel[presentation=scroll]');
  await expect(scroll).toHaveAttribute('dir', 'rtl');
  await expect(scroll.getByRole('button', { name: 'Slide 2' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await scroll.getByRole('button', { name: 'Slide 3' }).click();
  await expect(scroll.getByRole('button', { name: 'Slide 3' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await scroll.getByRole('button', { name: 'Slide 1' }).focus();
  await page.keyboard.press('Enter');
  await expect(scroll.getByRole('button', { name: 'Slide 1' })).toHaveAttribute(
    'aria-current',
    'true',
  );
});

for (const direction of ['ltr', 'rtl'] as const) {
  test(`projected tabs retain readable selected and inactive surfaces in both themes ${direction}`, async ({
    page,
  }) => {
    const demo = page.locator('#migration-primitives-demo');
    await choose(demo, 'Migration language', direction === 'rtl' ? 'fa' : 'en');
    const tabs = demo.getByRole('tablist', { name: 'Migration sections' });
    const items = tabs.getByRole('tab');
    for (const mode of ['light', 'dark'] as const) {
      if (mode === 'dark')
        await demo
          .getByRole('switch', { name: 'Cycle migration theme' })
          .press('Space');
      await expect(demo).toHaveAttribute('data-theme', mode);
      for (const index of [1, 0]) {
        await items.nth(index).click();
        await expect(items.nth(index)).toHaveAttribute('aria-selected', 'true');
        await expect(items.nth(index)).toHaveCSS(
          'background-color',
          mode === 'dark' ? 'rgb(30, 30, 38)' : 'rgb(255, 255, 255)',
        );
        await expect(items.nth(1 - index)).toHaveCSS(
          'background-color',
          mode === 'dark'
            ? 'rgba(213, 213, 213, 0.15)'
            : 'rgba(30, 30, 38, 0.15)',
        );
        await expect(items.nth(index)).toHaveCSS(
          'color',
          mode === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
        );
      }
    }
  });
}
