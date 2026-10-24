import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/shared');
  await page.getByRole('button', { name: 'Toggle language' }).click();
});
test('table sorts, pages, expands projected rows and keeps URL/filter/back-navigation in sync', async ({
  page,
}) => {
  const table = page.getByRole('table');
  await expect(table.getByRole('row')).toHaveCount(6);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(table.locator('tbody tr').first()).toContainText('Project 06');
  await page.getByRole('button', { name: /^ID/ }).click();
  await expect(page).toHaveURL(/sort=id/);
  await expect(page).not.toHaveURL(/page=2/);
  await page.getByRole('button', { name: /^ID/ }).click();
  await expect(table.locator('tbody tr').first()).toContainText('24');
  await expect(table.locator('th').first()).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  await page
    .getByRole('button', { name: 'Show details', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: 'Hide details', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(table.locator('.details')).toContainText(
    'Projected row content',
  );
  await page
    .getByRole('searchbox', { name: 'Search', exact: true })
    .fill('Project 01');
  await expect(page).toHaveURL(/search=Project(?:%20|\+)01/);
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('searchbox').fill('');
  await page.getByRole('combobox', { name: 'Status', exact: true }).click();
  await page.getByRole('option', { name: 'active', exact: true }).click();
  await expect(page).toHaveURL(/filter=status/);
  await expect(table.locator('tbody tr').first()).toContainText('active');
  await page.getByText('Request parameters', { exact: true }).click();
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.getByTestId('query-output').textContent()) ?? '{}',
        ).filter,
    )
    .toBe('status:eq("active")');
  await page.goBack();
  await expect(page).not.toHaveURL(/filter=/);
  await expect(
    page.getByRole('combobox', { name: 'Status', exact: true }),
  ).not.toContainText('active');
});
test('table loading, error, empty, disabled and server-side states are explicit', async ({
  page,
}) => {
  const table = page.getByRole('table');
  await page.getByRole('checkbox', { name: 'Loading', exact: true }).check();
  await expect(table.getByRole('status')).toHaveText('Loading…');
  await expect(page.getByRole('button', { name: /^ID/ })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Loading', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'Error', exact: true }).check();
  await expect(table.getByRole('status')).toContainText('Unable');
  await page.getByRole('checkbox', { name: 'Error', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'Empty', exact: true }).check();
  await expect(table.getByRole('status')).toHaveText('No records');
  await page.getByRole('checkbox', { name: 'Empty', exact: true }).uncheck();
  await page
    .getByRole('checkbox', {
      name: 'Server pagination (simulated)',
      exact: true,
    })
    .check();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(table.locator('tbody tr').first()).toContainText('Project 06');
  await page.getByRole('checkbox', { name: 'Disabled', exact: true }).check();
  await expect(page.getByRole('button', { name: /^ID/ })).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Show details', exact: true }).first(),
  ).toBeDisabled();
});
test('OTP supports localized paste/autofill, validation, native rating keys and CVA reset', async ({
  page,
}) => {
  const otp = page.getByRole('textbox', { name: 'One-time code', exact: true });
  await page
    .getByRole('button', { name: 'Validate controls', exact: true })
    .click();
  await expect(otp).toHaveAttribute('aria-invalid', 'true');
  await otp.fill('۱۲٣۴۵۶');
  await expect(otp).toHaveValue('123456');
  const radio = page.getByRole('radio', { name: '3 / 5', exact: true });
  await radio.check();
  await radio.press('ArrowRight');
  await expect(
    page.getByRole('radio', { name: '4 / 5', exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole('status').filter({ hasText: /^Valid$/ }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Reset controls', exact: true })
    .click();
  await expect(otp).toHaveValue('');
  await expect(
    page.getByRole('radio', { name: '4 / 5', exact: true }),
  ).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Disabled', exact: true }).check();
  await expect(otp).toBeDisabled();
  await expect(radio).toBeDisabled();
});
test('file selection validates extension, size and count, preserves names and clears native input', async ({
  page,
}) => {
  const input = page.getByLabel('Choose images or CSV', { exact: true });
  await input.setInputFiles({
    name: 'sample.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name\na'),
  });
  await expect(page.locator('bulud-file-upload')).toContainText('sample.csv');
  await expect(page.locator('#file-message')).toBeEmpty();
  await input.setInputFiles({
    name: 'bad.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('pdf'),
  });
  await expect(page.locator('#file-message')).toContainText('At most');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.setInputFiles({
    name: 'large.csv',
    mimeType: 'text/csv',
    buffer: Buffer.alloc(1048577),
  });
  await expect(page.locator('#file-message')).toContainText('At most');
  await input.setInputFiles(
    ['a.csv', 'b.csv', 'c.csv'].map((name) => ({
      name,
      mimeType: 'text/csv',
      buffer: Buffer.from('x'),
    })),
  );
  await expect(page.locator('#file-message')).toContainText('At most');
  await page.getByRole('button', { name: 'Clear files', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(page.locator('#file-message')).toBeEmpty();
});
test('tooltip opens on focus/hover, closes on Escape, and notices render/dismiss as text', async ({
  page,
}) => {
  const trigger = page.getByRole('button', {
    name: 'Tooltip help',
    exact: true,
  });
  await trigger.focus();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect(trigger).toHaveAttribute(
    'aria-describedby',
    (await tooltip.getAttribute('id')) as string,
  );
  await trigger.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByRole('heading', { name: 'Hints & notifications' }).click();
  await trigger.hover();
  await expect(tooltip).toBeVisible();
  await page.getByRole('heading', { name: 'Hints & notifications' }).hover();
  await expect(tooltip).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Show notification', exact: true })
    .click();
  await expect(page.locator('bulud-notifications')).toContainText(
    'Action completed',
  );
  await page
    .getByRole('button', { name: 'Dismiss notification', exact: true })
    .click();
  await expect(page.locator('bulud-notifications bulud-alert')).toHaveCount(0);
  await expect(
    page.getByRole('group', { name: 'Notifications', exact: true }),
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Dismiss message', exact: true })
    .click();
  await expect(
    page.getByText('A shared alert with your projected content.', {
      exact: true,
    }),
  ).toHaveCount(0);
});
test('stepper and carousel support keyboard activation, disabled steps and stable boundary controls', async ({
  page,
}) => {
  await page.getByRole('button', { name: /Review/ }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('region', { name: 'Review', exact: true }),
  ).toHaveCount(1);
  await expect(page.locator('bulud-stepper section')).toContainText(
    'Review step content',
  );
  await expect(
    page.getByRole('button', { name: /Unavailable/ }),
  ).toBeDisabled();
  const previous = page.getByRole('button', {
      name: 'Previous slide',
      exact: true,
    }),
    next = page.getByRole('button', { name: 'Next slide', exact: true });
  await expect(previous).toBeDisabled();
  await next.focus();
  await page.keyboard.press('Space');
  await expect(
    page.locator('bulud-carousel [aria-roledescription=slide]'),
  ).toContainText('Two themes');
  await expect(next).toBeDisabled();
  await previous.click();
  await expect(
    page.locator('bulud-carousel [aria-roledescription=slide]'),
  ).toContainText('One foundation');
});
test('countdown expires once and utility services update without app dependencies', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'Start 3-second countdown', exact: true })
    .click();
  await expect(page.getByRole('timer', { name: 'Time remaining' })).toHaveText(
    '00:00:03',
  );
  await expect(page.locator('bulud-notifications')).toContainText(
    'Time elapsed',
    { timeout: 6000 },
  );
  await expect(page.getByRole('timer')).toHaveText('00:00:00');
  await expect(page.locator('bulud-notifications bulud-alert')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Generate random password', exact: true })
    .click();
  await expect(page.locator('output')).toHaveText(/.{16}/);
  await expect(page.getByText(/Browser connection/)).toContainText('Online');
});
for (const rtl of [true, false])
  for (const dark of [false, true])
    test(`shared controls ${rtl ? 'RTL' : 'LTR'} ${dark ? 'dark' : 'light'} and theme override`, async ({
      page,
    }) => {
      if (rtl)
        await page.getByRole('button', { name: 'Toggle language' }).click();
      if (dark)
        await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        rtl ? 'rtl' : 'ltr',
      );
      const primary = dark ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)';
      const searchIcon = page.locator('.search-icon');
      await expect(searchIcon).toBeVisible();
      await expect(searchIcon).toHaveAttribute('aria-hidden', 'true');
      const inputBox = await page.getByRole('searchbox').boundingBox();
      const iconBox = await searchIcon.boundingBox();
      expect(inputBox).not.toBeNull();
      expect(iconBox).not.toBeNull();
      if (inputBox && iconBox)
        expect(iconBox.x < inputBox.x + inputBox.width / 2).toBe(!rtl);
      await expect(page.locator('.toolbar bulud-checkbox')).toHaveCount(6);
      const checkbox = page.getByRole('checkbox', {
        name: rtl ? 'رنگ سفارشی' : 'Custom theme',
        exact: true,
      });
      await expect(checkbox).toHaveCSS('appearance', 'none');
      await page.getByRole('radio', { name: '2 / 5', exact: true }).check();
      const filled = page.locator('bulud-rating .star span.filled');
      await expect(filled).toHaveCount(2);
      await expect(filled.first()).toHaveCSS('color', primary);
      await expect(
        page
          .locator('bulud-rating .star > span:first-of-type:not(.filled)')
          .first(),
      ).not.toHaveCSS('color', primary);
      const surface = page.locator('bulud-table .surface');
      await expect(surface).toHaveCSS(
        'background-color',
        dark ? 'rgb(30, 30, 38)' : 'rgb(255, 255, 255)',
      );
      await page
        .getByRole('checkbox', {
          name: rtl ? 'رنگ سفارشی' : 'Custom theme',
          exact: true,
        })
        .check();
      await expect(surface).toHaveCSS('border-top-color', 'rgb(126, 34, 206)');
      await expect(page.locator('bulud-otp input')).toHaveCSS(
        'border-top-color',
        'rgb(126, 34, 206)',
      );
      await expect(filled.first()).toHaveCSS('color', 'rgb(126, 34, 206)');
      await expect(checkbox).toHaveCSS(
        'background-color',
        dark ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)',
      );
      await page
        .getByRole('checkbox', {
          name: rtl ? 'رنگ سفارشی' : 'Custom theme',
          exact: true,
        })
        .uncheck();
      await expect(surface).not.toHaveCSS(
        'border-top-color',
        'rgb(126, 34, 206)',
      );
      await expect(filled.first()).toHaveCSS('color', primary);
      const centered = await page
        .locator('bulud-table .bulud-pagination__control')
        .evaluateAll((buttons) =>
          buttons.every((button) => {
            const icon = button.querySelector('svg');
            if (!icon) return false;
            const b = button.getBoundingClientRect(),
              i = icon.getBoundingClientRect();
            return (
              Math.abs(b.top + b.height / 2 - (i.top + i.height / 2)) < 0.6
            );
          }),
        );
      expect(centered).toBe(true);
      await page
        .getByRole('combobox', { name: rtl ? 'وضعیت' : 'Status', exact: true })
        .click();
      const dropdownSearch = page.locator('.bulud-dropdown__search input');
      await expect(dropdownSearch).toBeFocused();
      await expect(dropdownSearch).toHaveCSS('outline-style', 'none');
      await expect(dropdownSearch).toHaveCSS('border-top-width', '0px');
      await expect(page.locator('.bulud-dropdown__search')).toHaveCSS(
        'border-top-width',
        '1px',
      );
      await expect(page.locator('.bulud-dropdown__search')).toHaveCSS(
        'border-top-left-radius',
        '8px',
      );
      const attachment = await page
        .locator('.bulud-dropdown__panel')
        .evaluate((panel) => {
          const trigger = panel.parentElement?.querySelector(
            '.bulud-dropdown__trigger',
          );
          return trigger
            ? Math.abs(
                panel.getBoundingClientRect().top -
                  trigger.getBoundingClientRect().bottom,
              )
            : Infinity;
        });
      expect(attachment).toBeLessThanOrEqual(1.1);
      await dropdownSearch.press('Escape');
      await page.setViewportSize({ width: 390, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
