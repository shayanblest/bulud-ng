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
    await expect(
      page.locator('#variants .bulud-button--primary'),
    ).toBeVisible();
    await expect(
      page.locator('#variants .bulud-button--secondary'),
    ).toBeVisible();
    await expect(page.locator('#variants .bulud-button--danger')).toBeVisible();
    await expect(page.locator('#variants .bulud-button--ghost')).toBeVisible();

    await expect(page.locator('.bulud-button--small')).toBeVisible();
    await expect(page.locator('.bulud-button--medium').first()).toBeVisible();
    await expect(page.locator('.bulud-button--large').first()).toBeVisible();

    const states = page.locator('#states bulud-button');
    await expect(states.nth(1).locator('button')).toBeDisabled();
    await expect(states.nth(2).locator('button')).toBeDisabled();
    await expect(states.nth(2).locator('button')).toHaveAttribute(
      'aria-busy',
      'true',
    );

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
    await expect(badges).toHaveCount(15);
    for (const variant of [
      'neutral',
      'primary',
      'success',
      'warning',
      'danger',
    ]) {
      await expect(
        page.locator(`#badge .bulud-badge--${variant}`).first(),
      ).toBeVisible();
    }

    const dismissible = page
      .locator('#badge bulud-badge[variant="primary"]')
      .last();
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
    await expect(button.locator('button')).toHaveCSS(
      'background-color',
      'rgb(18, 52, 86)',
    );
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

  test('covers tabs semantics, selection, disabled state, orientation, and theme override', async ({
    page,
  }) => {
    const tabs = page.locator('#tabs bulud-tabs').first();
    const tablist = tabs.locator('[role="tablist"]');
    const tabButtons = tabs.locator('[role="tab"]');

    await expect(tablist).toHaveAttribute('aria-label', 'Account sections');
    await expect(tabButtons).toHaveCount(3);
    await expect(tabButtons.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(tabButtons.nth(2)).toBeDisabled();
    await expect(tabButtons.nth(2)).toHaveAttribute('aria-disabled', 'true');

    const overviewPanel = tabs.locator('[role="tabpanel"]').nth(0);
    const activityPanel = tabs.locator('[role="tabpanel"]').nth(1);
    await expect(tabButtons.nth(0)).toHaveAttribute(
      'aria-controls',
      await overviewPanel.getAttribute('id'),
    );
    await expect(overviewPanel).toBeVisible();
    await expect(activityPanel).toBeHidden();

    await tabButtons.nth(0).press('ArrowRight');
    await expect(tabButtons.nth(1)).toBeFocused();
    await expect(tabButtons.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabs-active')).toHaveText(
      'Active tab: activity',
    );
    await tabButtons.nth(1).press('ArrowRight');
    await expect(tabButtons.nth(0)).toBeFocused();
    await tabButtons.nth(0).press('End');
    await expect(tabButtons.nth(1)).toBeFocused();

    await expect(tabButtons.nth(1)).toHaveCSS(
      'border-bottom-color',
      'rgb(124, 58, 237)',
    );

    const verticalTabs = page.locator('#tabs bulud-tabs').nth(1);
    const verticalTablist = verticalTabs.locator('[role="tablist"]');
    const verticalButtons = verticalTabs.locator('[role="tab"]');
    await expect(verticalTablist).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
    await verticalButtons.nth(0).focus();
    await verticalButtons.nth(0).press('ArrowDown');
    await expect(verticalButtons.nth(1)).toBeFocused();
    await expect(verticalButtons.nth(1)).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('covers accordion single and multiple expansion, disabled state, keyboard, and theme override', async ({
    page,
  }) => {
    const accordion = page.locator('#accordion');
    const single = accordion.locator('bulud-accordion').first();
    const triggers = single.locator('.bulud-accordion-item__trigger');
    const panels = single.locator('[role="region"]');

    await expect(triggers).toHaveCount(3);
    await expect(triggers.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await expect(triggers.nth(2)).toBeDisabled();
    await expect(triggers.nth(2)).toHaveAttribute('aria-disabled', 'true');
    await expect(triggers.nth(0)).toHaveAttribute(
      'aria-controls',
      await panels.nth(0).getAttribute('id'),
    );
    await expect(panels.nth(0)).toBeVisible();
    await expect(panels.nth(1)).toBeHidden();

    await triggers.nth(0).press('ArrowDown');
    await expect(triggers.nth(1)).toBeFocused();
    await expect(triggers.nth(1)).toHaveAttribute('aria-expanded', 'false');
    await triggers.nth(1).press('Enter');
    await expect(triggers.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#accordion-single-state')).toHaveText(
      'Expanded: details',
    );
    await triggers.nth(1).press('Enter');
    await expect(triggers.nth(1)).toHaveAttribute('aria-expanded', 'false');
    await expect(triggers.nth(1)).toBeFocused();

    await expect(triggers.nth(1)).toHaveCSS(
      'outline-color',
      'rgb(124, 58, 237)',
    );

    const multiple = accordion.locator('bulud-accordion').nth(1);
    const multipleTriggers = multiple.locator('.bulud-accordion-item__trigger');
    await expect(multipleTriggers.nth(0)).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await multipleTriggers.nth(1).press(' ');
    await expect(multipleTriggers.nth(1)).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(multiple.locator('[role="region"]').nth(1)).toBeVisible();

    await page.locator('html').evaluate((element) => {
      element.dir = 'ltr';
    });
    await accordion.evaluate((element) => {
      element.setAttribute('dir', 'rtl');
    });
    await expect(single).toHaveCSS('direction', 'rtl');
  });

  test('covers locale switching, RTL direction, and explicit light/dark theme selectors', async ({
    page,
  }) => {
    const language = page.locator('header button').first();
    await language.click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(
      page.locator('#dropdown bulud-dropdown').first().locator('input'),
    ).toHaveCount(0);

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
    await expect(
      page.locator('#badge .bulud-badge--success').first(),
    ).toHaveCSS('background-color', 'rgb(20, 83, 45)');
  });

  test('covers resize observer enabled, disabled, and re-enabled states', async ({
    page,
  }) => {
    const target = page.locator('#resize-observer-target');
    const size = page.locator('#resize-observer-size');
    const notifications = page.locator('#resize-observer-notifications');
    const enabled = page.locator('#resize-observer-enabled');

    await expect(target).toHaveAttribute(
      'aria-label',
      'Resize observer target',
    );
    const initialSize = (await size.textContent())?.trim() ?? '';
    expect(initialSize).toMatch(/^Content box: \d+ × \d+px$/);
    await expect(notifications).toHaveText('Notifications: 1');

    await target.evaluate((element) => {
      (element as HTMLElement).style.width = '240px';
      (element as HTMLElement).style.height = '120px';
    });
    await expect(notifications).toHaveText('Notifications: 1');

    await enabled.uncheck();
    await target.evaluate((element) => {
      (element as HTMLElement).style.width = '300px';
      (element as HTMLElement).style.height = '160px';
    });
    await expect(size).toHaveText(initialSize);
    await expect(notifications).toHaveText('Notifications: 1');

    await enabled.check();
    await expect(size).not.toHaveText(initialSize);
    await expect(size).toContainText('Content box:');
    await expect(notifications).toHaveText('Notifications: 2');
  });

  test('covers click outside inside, outside, and disabled interaction', async ({
    page,
  }) => {
    const inside = page.locator('#clickoutside-inside');
    const outside = page.locator('#clickoutside-outside');
    const count = page.locator('#clickoutside-count');

    await inside.click();
    await expect(count).toHaveText('Outside notifications: 0');

    await outside.click();
    await expect(count).toHaveText('Outside notifications: 1');

    await page.locator('#clickoutside-enabled').uncheck();
    await outside.click();
    await expect(count).toHaveText('Outside notifications: 2');
  });

  test('covers textarea autosize growth, shrink, max scrolling, and re-enable', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const enabled = page.locator('#textarea-autosize-enabled');

    await textarea.evaluate((element) => {
      element.style.lineHeight = 'normal';
    });
    await textarea.fill('Short value.');
    const initialHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    await expect
      .poll(() =>
        textarea.evaluate((element) => getComputedStyle(element).lineHeight),
      )
      .toBe('normal');
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBe(initialHeight);

    const widthBeforeMetricChange = await textarea.evaluate(
      (element) => element.getBoundingClientRect().width,
    );
    await textarea.evaluate((element) => {
      element.style.fontSize = '28px';
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeGreaterThan(initialHeight);
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBe(widthBeforeMetricChange);

    await textarea.evaluate((element) => {
      element.style.fontSize = '16px';
      element.style.lineHeight = '19.2px';
    });
    await textarea.fill('one\ntwo\nthree\nfour\nfive');
    await expect(textarea).toHaveCSS('overflow-y', 'hidden');
    await textarea.fill('one\ntwo\nthree\nfour\nfive\nsix');
    await expect(textarea).toHaveCSS('overflow-y', 'auto');
    await textarea.evaluate((element) => {
      element.style.fontSize = '';
      element.style.lineHeight = 'normal';
    });

    await page.locator('#textarea-autosize-long').click();
    const longHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    expect(longHeight).toBeGreaterThan(initialHeight);
    await expect(textarea).toHaveCSS('overflow-y', 'auto');
    await expect
      .poll(() =>
        textarea.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        ),
      )
      .toBe(true);

    await page.locator('#textarea-autosize-short').click();
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBe(initialHeight);
    await expect(textarea).toHaveCSS('overflow-y', 'hidden');
    await expect
      .poll(() =>
        textarea.evaluate(
          (element) => element.scrollHeight <= element.clientHeight,
        ),
      )
      .toBe(true);

    await enabled.uncheck();
    await page.locator('#textarea-autosize-long').click();
    await expect(textarea).toHaveCSS('height', `${initialHeight}px`);

    await enabled.check();
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeGreaterThan(initialHeight);
  });
});
