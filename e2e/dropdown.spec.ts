import { expect, test } from '@playwright/test';

for (const direction of ['rtl', 'ltr'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test.describe(`Dropdown ${theme} ${direction}`, () => {
      const surface = theme === 'dark' ? 'rgb(0, 0, 0)' : 'rgb(243, 246, 249)';
      const optionBackground =
        theme === 'dark' ? 'rgb(52, 52, 60)' : 'rgb(243, 246, 249)';
      const placeholder =
        direction === 'rtl' ? 'یک گزینه انتخاب کنید' : 'Select an option';

      test.beforeEach(async ({ page }) => {
        await page.goto('/#all');
        if (direction === 'ltr') {
          await page.locator('#demo-language-toggle').click();
        }
        if (theme === 'dark') {
          await page.locator('#dropdown-dark').check();
        }
        await expect(page.locator('html')).toHaveAttribute('dir', direction);
      });

      test('disables pointer and tab access without losing the selected value', async ({
        page,
      }) => {
        const single = page.locator('#demo-dropdown-single');
        const trigger = single.getByRole('combobox');
        const clear = single.getByRole('button', { name: 'Clear selection' });
        await expect(trigger).toBeEnabled();
        await expect(trigger).toHaveCSS('background-color', surface);
        await expect(trigger).toHaveCSS('direction', direction);
        await trigger.hover();
        await expect(trigger).toHaveCSS(
          'border-top-color',
          theme === 'dark' ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)',
        );
        await page.locator('#dropdown-dark').focus();
        await page.keyboard.press('Tab');
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveCSS('outline-width', '3px');
        await expect(trigger).toHaveCSS(
          'outline-color',
          theme === 'dark' ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)',
        );
        await trigger.press('ArrowDown');
        const search = single.getByRole('searchbox', {
          name: 'Search options',
        });
        await expect(search).toBeFocused();
        await search.press('Enter');
        await expect(trigger).toHaveText('Angular');
        await expect(trigger).toBeFocused();
        await expect(clear).toBeVisible();

        await page.locator('#dropdown-disabled').check();
        await expect(trigger).toBeDisabled();
        await expect(trigger).toHaveCSS('opacity', '0.55');
        await expect(clear).toHaveCount(0);
        await trigger.click({ force: true });
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(single.getByRole('listbox')).toHaveCount(0);
        await expect(trigger).toHaveText('Angular');
        await page.locator('#dropdown-dark').focus();
        await page.keyboard.press('Tab');
        await expect(
          page.locator('#demo-dropdown-multiple').getByRole('combobox'),
        ).toBeFocused();
        await page.locator('#dropdown-disabled').uncheck();
        await expect(trigger).toBeEnabled();
        await expect(trigger).toHaveText('Angular');
        await expect(clear).toBeVisible();
        await trigger.click();
        await expect(
          single.getByRole('option', { name: 'Angular Framework' }),
        ).toHaveAttribute('aria-selected', 'true');
      });

      test('clears single and multiple selections with pointer and keyboard and restores trigger focus', async ({
        page,
      }) => {
        const single = page.locator('#demo-dropdown-single');
        const trigger = single.getByRole('combobox');
        await trigger.click();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(trigger).toHaveCSS('border-end-start-radius', '0px');
        await expect(trigger).toHaveCSS('border-end-end-radius', '0px');
        await expect(single.locator('.bulud-dropdown__panel')).toHaveCSS(
          'border-start-start-radius',
          '0px',
        );
        await expect(single.locator('.bulud-dropdown__panel')).toHaveCSS(
          'border-start-end-radius',
          '0px',
        );

        await expect(single.locator('.bulud-dropdown__panel')).toHaveCSS(
          'background-color',
          surface,
        );
        const angular = single.getByRole('option', {
          name: 'Angular Framework',
        });
        await angular.hover();
        await expect(angular).toHaveCSS('background-color', optionBackground);
        await angular.click();
        await expect(trigger).toHaveText('Angular');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(trigger).toHaveCSS('border-end-start-radius', '8px');
        const clear = single.getByRole('button', { name: 'Clear selection' });
        await expect(clear).toHaveCSS(
          direction === 'rtl' ? 'left' : 'right',
          '44px',
        );
        await clear.hover();
        await expect(clear).toHaveCSS(
          'background-color',
          theme === 'dark' ? 'rgb(52, 52, 60)' : 'rgb(243, 246, 249)',
        );
        await clear.click();
        await expect(trigger).toHaveText(placeholder);
        await expect(clear).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await trigger.press('ArrowDown');
        await expect(angular).toHaveAttribute('aria-selected', 'false');
        await single.getByRole('searchbox').press('Escape');
        await expect(trigger).toBeFocused();

        const multiple = page.locator('#demo-dropdown-multiple');
        const multipleTrigger = multiple.getByRole('combobox');
        await multipleTrigger.click();
        const listbox = multiple.getByRole('listbox');
        await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
        await expect(listbox).toHaveCSS('direction', direction);
        await multiple
          .getByRole('option', { name: 'Maya Chen Design systems' })
          .click();
        await multiple
          .getByRole('option', { name: 'Noah Williams Frontend platform' })
          .click();
        await expect(
          multiple.getByRole('option', { selected: true }),
        ).toHaveCount(2);
        await expect(multipleTrigger).toHaveText('2 selected');
        const multipleClear = multiple.getByRole('button', {
          name: 'Clear selection',
        });
        await multipleTrigger.focus();
        await page.keyboard.press('Tab');
        await expect(multipleClear).toBeFocused();
        await expect(multipleClear).toHaveCSS('outline-width', '3px');
        await multipleClear.press('Space');
        await expect(multipleTrigger).toHaveText(placeholder);
        await expect(multipleClear).toHaveCount(0);
        await expect(multipleTrigger).toBeFocused();
        await expect(multipleTrigger).toHaveAttribute('aria-expanded', 'true');
        await expect(
          multiple.getByRole('option', { selected: true }),
        ).toHaveCount(0);
        await multipleTrigger.press('Escape');
        await expect(multipleTrigger).toHaveAttribute('aria-expanded', 'false');
        await expect(multipleTrigger).toBeFocused();

        await single.evaluate((el) =>
          el.style.setProperty('--bulud-dropdown-background', '#123456'),
        );
        await expect(trigger).toHaveCSS('background-color', 'rgb(18, 52, 86)');
        await single.evaluate((el) =>
          el.style.removeProperty('--bulud-dropdown-background'),
        );
        await expect(trigger).toHaveCSS('background-color', surface);
      });

      test('validates the required form on blur and selection and propagates clear back to the form', async ({
        page,
      }) => {
        const scope = page.locator('#dropdown-forms');
        const required = scope.locator('#demo-dropdown-required');
        const trigger = required.getByRole('combobox', {
          name: 'Required framework',
        });
        const status = scope.locator('[aria-live="polite"]');
        const clear = required.getByRole('button', { name: 'Clear selection' });
        await expect(trigger).toHaveAttribute('aria-required', 'true');
        await expect(trigger).not.toHaveAttribute('aria-invalid');
        await expect(trigger).toHaveCSS('background-color', surface);
        await expect(trigger).toHaveCSS('direction', direction);
        await expect(status).toHaveText('Form status: invalid');
        await expect(clear).toHaveCount(0);
        await trigger.click();
        await expect(required.getByRole('searchbox')).toBeFocused();
        await expect(trigger).not.toHaveAttribute('aria-invalid');
        await required.getByRole('searchbox').press('Escape');
        await expect(trigger).toBeFocused();
        await expect(trigger).not.toHaveAttribute('aria-invalid');
        await page.keyboard.press('Tab');
        await expect(trigger).not.toBeFocused();
        await expect(trigger).toHaveAttribute('aria-invalid', 'true');
        await expect(required).toHaveClass(/bulud-dropdown-host--invalid/);
        await expect(trigger).toHaveCSS(
          'border-top-color',
          theme === 'dark'
            ? 'rgb(211, 48, 48)'
            : theme === 'dark'
              ? 'rgb(211, 48, 48)'
              : 'rgb(161, 23, 41)',
        );
        await trigger.hover();
        await expect(trigger).toHaveCSS(
          'border-top-color',
          theme === 'dark'
            ? 'rgb(211, 48, 48)'
            : theme === 'dark'
              ? 'rgb(211, 48, 48)'
              : 'rgb(161, 23, 41)',
        );
        await trigger.press('ArrowDown');
        await required.getByRole('searchbox').press('Enter');
        await expect(trigger).toHaveText('Angular');
        await expect(trigger).toBeFocused();
        await expect(status).toHaveText('Form status: valid');
        await expect(trigger).not.toHaveAttribute('aria-invalid');
        await expect(required).not.toHaveClass(/bulud-dropdown-host--invalid/);
        await expect(trigger).toHaveAttribute('aria-required', 'true');
        await page.keyboard.press('Tab');
        await expect(clear).toBeFocused();
        await clear.press('Enter');
        await expect(trigger).toBeFocused();
        await expect(clear).toHaveCount(0);
        await expect(trigger).toHaveText('Select an option');
        await expect(status).toHaveText('Form status: invalid');
        await expect(trigger).toHaveAttribute('aria-invalid', 'true');
        await expect(trigger).toHaveAttribute('aria-required', 'true');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await trigger.click();
        await expect(
          required.getByRole('option', { selected: true }),
        ).toHaveCount(0);
        await required
          .getByRole('option', { name: 'React', exact: true })
          .click();
        await expect(status).toHaveText('Form status: valid');
        await expect(trigger).not.toHaveAttribute('aria-invalid');
      });
    });
  }
}

test('Angour typography is compact across locale, mobile, dark and project overrides', async ({
  page,
}) => {
  await page.goto('/#angour');
  const host = page.locator('#angour-dropdown');
  const trigger = host.locator('.bulud-dropdown__trigger');
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const lang of ['fa', 'en', 'ar', 'tr']) {
      await page.locator('html, #angour').evaluateAll(
        (roots, lang) =>
          roots.forEach((root) => {
            root.setAttribute('lang', lang);
            root.setAttribute(
              'dir',
              ['fa', 'ar'].includes(lang) ? 'rtl' : 'ltr',
            );
          }),
        lang,
      );
      await expect(trigger).toHaveCSS(
        'font-size',
        width > 576 && lang === 'fa' ? '14px' : '12px',
      );
      await expect(trigger).toHaveCSS('font-weight', '400');
      const geometry = await trigger.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          height: el.getBoundingClientRect().height,
          content:
            parseFloat(s.lineHeight) +
            parseFloat(s.paddingTop) +
            parseFloat(s.paddingBottom) +
            parseFloat(s.borderTopWidth) +
            parseFloat(s.borderBottomWidth),
        };
      });
      expect(geometry.height).toBeCloseTo(geometry.content, 1);
    }
  }
  await page.locator('header bulud-switch label').click();
  await expect(trigger).toHaveCSS('font-size', '12px');
  await trigger.click();
  await expect(host.getByRole('option').first()).toHaveCSS('font-size', '12px');
  await page.keyboard.press('Escape');
  await host.evaluate((el) => {
    el.style.setProperty('--bulud-dropdown-font-size', '10px');
    el.style.setProperty('--bulud-dropdown-padding-block', '8px');
  });
  await expect(trigger).toHaveCSS('font-size', '10px');
  await expect(trigger).toHaveCSS('padding-top', '8px');
});

test('adjacent selected options share only their outer rounded corners', async ({
  page,
}) => {
  await page.goto('/#all');
  const host = page.locator('#demo-dropdown-multiple');
  await host.getByRole('combobox').click();
  const options = host.getByRole('option');
  await options.nth(0).click();
  await options.nth(1).click();
  await expect(options.nth(0)).toHaveCSS('border-bottom-left-radius', '0px');
  await expect(options.nth(0)).toHaveCSS('border-top-left-radius', '8px');
  await expect(options.nth(1)).toHaveCSS('border-top-left-radius', '0px');
  await expect(options.nth(1)).toHaveCSS('border-bottom-left-radius', '8px');
  await options.nth(0).click();
  await expect(options.nth(1)).toHaveCSS('border-top-left-radius', '8px');
});

test('clear icon is smaller than its preserved pointer target and can be customized', async ({
  page,
}) => {
  await page.goto('/#all');
  const host = page.locator('#demo-dropdown-single');
  await host.getByRole('combobox').click();
  await host.getByRole('option').first().click();
  const clear = host.getByRole('button', { name: 'Clear selection' });
  const svg = clear.locator('svg');
  const icon = await svg.boundingBox();
  const target = await clear.boundingBox();
  expect(icon!.width).toBeLessThan(target!.width);
  expect(icon!.width).toBe(16);
  await host.evaluate((el) =>
    el.style.setProperty('--bulud-dropdown-clear-icon-size', '12px'),
  );
  await expect(svg).toHaveCSS('width', '12px');
  await clear.click();
  await expect(clear).toHaveCount(0);
  await expect(host.getByRole('combobox')).toBeFocused();
});
