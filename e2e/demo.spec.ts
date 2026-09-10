import { expect, test } from '@playwright/test';

test.describe('Bulud component demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('covers button variants, sizes, disabled, loading, and reactive click state', async ({
    page,
  }) => {
    const variants = page.locator('#variants bulud-button');
    await expect(variants).toHaveCount(4);
    await expect(page.locator('#variants .bulud-button--primary')).toBeVisible();
    await expect(page.locator('#variants .bulud-button--secondary')).toBeVisible();
    await expect(page.locator('#variants .bulud-button--danger')).toBeVisible();
    await expect(page.locator('#variants .bulud-button--ghost')).toBeVisible();

    await expect(page.locator('.bulud-button--small')).toBeVisible();
    await expect(page.locator('.bulud-button--medium').first()).toBeVisible();
    await expect(page.locator('.bulud-button--large').first()).toBeVisible();

    const states = page.locator('#states bulud-button');
    await expect(states.nth(1).locator('button')).toBeDisabled();
    await expect(states.nth(2).locator('button')).toBeDisabled();
    await expect(states.nth(2).locator('button')).toHaveAttribute('aria-busy', 'true');

    const interactive = page.locator('#interactive');
    const action = interactive.locator('bulud-button');
    await action.locator('button').focus();
    await expect(action.locator('button')).toBeFocused();
    await action.hover();
    await action.locator('button').click();
    await expect(interactive).toContainText('1');
  });

  test('covers badge variants, dismiss action, and theme instance override', async ({
    page,
  }) => {
    const badges = page.locator('#badge bulud-badge');
    await expect(badges).toHaveCount(7);
    for (const variant of ['neutral', 'primary', 'success', 'warning', 'danger']) {
      await expect(page.locator(`#badge .bulud-badge--${variant}`).first()).toBeVisible();
    }

    const dismissible = page.locator('#badge bulud-badge[variant="primary"]').last();
    await expect(dismissible.locator('button')).toHaveAttribute(
      'aria-label',
      'Remove badge',
    );
    await dismissible.locator('button').click();
    await expect(dismissible.locator('button')).toBeVisible();

    const button = page.locator('#variants bulud-button').first();
    await button.evaluate((element) => {
      element.style.setProperty('--bulud-button-background', '#123456');
    });
    await expect(button.locator('button')).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  });

  test('covers dropdown pointer, keyboard opening, search, single, and multiple selection', async ({
    page,
  }) => {
    const single = page.locator('#dropdown bulud-dropdown').first();
    const trigger = single.locator('.bulud-dropdown__trigger');
    await expect(trigger).toHaveAttribute('role', 'combobox');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-controls', /-listbox$/);
    await trigger.press('ArrowDown');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(single.locator('[role="listbox"]')).toBeVisible();
    await expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      await single.locator('[role="option"]').first().getAttribute('id'),
    );
    await trigger.press('End');
    await expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      await single.locator('[role="option"]').last().getAttribute('id'),
    );
    await trigger.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    await trigger.press('ArrowDown');
    await trigger.press('Home');
    await trigger.press('Enter');
    await expect(trigger).toContainText('Angular');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.press('ArrowDown');
    await page.locator('h1').first().click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await page.locator('#dropdown-loading').check();
    await trigger.click();
    await expect(single.locator('[role="status"]')).toBeVisible();
    await trigger.press('Escape');
    await page.locator('#dropdown-loading').uncheck();
    await page.locator('#dropdown-empty').check();
    await trigger.click();
    await expect(single.locator('.bulud-dropdown__message')).toBeVisible();
    await trigger.press('Escape');
    await page.locator('#dropdown-empty').uncheck();
    await trigger.press('ArrowDown');

    const search = single.locator('input[type="search"]');
    await search.fill('React');
    await expect(single.locator('[role="option"]')).toHaveCount(1);
    await single.locator('[role="option"]').click();
    await expect(trigger).toContainText('React');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    const multiple = page.locator('#dropdown bulud-dropdown').nth(1);
    const multipleTrigger = multiple.locator('.bulud-dropdown__trigger');
    await multipleTrigger.click();
    await multiple.locator('[role="option"]').nth(0).click();
    await multiple.locator('[role="option"]').nth(1).click();
    await expect(multipleTrigger).toContainText('2 selected');
    await expect(multipleTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('covers locale switching, RTL direction, and explicit light/dark theme selectors', async ({
    page,
  }) => {
    const language = page.locator('header button').first();
    await language.click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('#dropdown bulud-dropdown').first().locator('input')).toHaveCount(0);

    await language.click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.locator('html').evaluate((element) => {
      for (const property of Array.from(element.style)) {
        if (property.startsWith('--bulud-')) {
          element.style.removeProperty(property);
        }
      }
      element.setAttribute('data-theme', 'dark');
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#badge .bulud-badge--success').first()).toHaveCSS(
      'background-color',
      'rgb(20, 83, 45)',
    );
  });
});
