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
    const action = page.locator('#demo-interactive-action');
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
    const disabledOption = single.locator('[role="option"]').filter({
      hasText: 'Svelte',
    });
    await expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
    await trigger.press('ArrowDown');
    await trigger.press('ArrowDown');
    await trigger.press('ArrowDown');
    await expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      await disabledOption.getAttribute('id'),
    );
    await trigger.press('Enter');
    await expect(trigger).not.toContainText('Svelte');
    await disabledOption.click();
    await expect(trigger).not.toContainText('Svelte');
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
    await page.locator('#dropdown-loading').click();
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
    await expect(search).toHaveAttribute('aria-label', 'Search options');
    await expect(search).toHaveAttribute(
      'aria-controls',
      await trigger.getAttribute('aria-controls'),
    );
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

    await multiple.locator('[role="option"]').last().press('Escape');
    await page.locator('#dropdown-disabled').check();
    await expect(trigger).toBeDisabled();
    await trigger.click({ force: true });
    await expect(single.locator('[role="listbox"]')).toHaveCount(0);
    await page.locator('#dropdown-disabled').uncheck();

    const formDropdown = page.locator('#dropdown-forms bulud-dropdown');
    const formTrigger = formDropdown.locator('.bulud-dropdown__trigger');
    await formTrigger.click();
    await expect(formDropdown.locator('input[type="search"]')).toBeFocused();
    await page.locator('h1').first().click();
    await expect(formTrigger).toHaveAttribute('aria-invalid', 'true');
    await expect(formDropdown).toHaveClass(/bulud-dropdown-host--invalid/);
    await expect(formTrigger).toHaveCSS('border-top-color', 'rgb(225, 29, 72)');
    await formTrigger.click();
    await formDropdown.locator('[role="option"]').first().click();
    await expect(formTrigger).toContainText('Angular');
    await expect(formTrigger).not.toHaveAttribute('aria-invalid', 'true');
    await expect(formDropdown).not.toHaveClass(/bulud-dropdown-host--invalid/);
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

  test('applies the scoped dark preview to dropdown, accordion, and tabs', async ({
    page,
  }) => {
    const darkToggle = page.locator('#dropdown-dark');
    const dropdownPreview = page.locator(
      '[data-testid="demo-dropdown-dark-preview"]',
    );
    const accordionPreview = page.locator(
      '[data-testid="demo-accordion-dark-preview"]',
    );
    const tabsPreview = page.locator('[data-testid="demo-tabs-dark-preview"]');
    const dropdownTrigger = page.locator(
      '[data-testid="demo-dropdown-dark-preview"] #demo-dropdown-single .bulud-dropdown__trigger',
    );
    const accordionTrigger = page.locator(
      '[data-testid="demo-accordion-dark-preview"] #demo-accordion-overview .bulud-accordion-item__trigger',
    );
    const tabsSurface = page.locator(
      '[data-testid="demo-tabs-dark-preview"] [data-testid="demo-tabs-horizontal"] .bulud-tabs',
    );

    await expect(dropdownPreview).not.toHaveAttribute('data-theme');
    await expect(accordionPreview).not.toHaveAttribute('data-theme');
    await expect(tabsPreview).not.toHaveAttribute('data-theme');
    await expect(dropdownTrigger).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    await expect(accordionTrigger).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    await expect(tabsSurface).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );

    await darkToggle.check();

    await expect(dropdownPreview).toHaveAttribute('data-theme', 'dark');
    await expect(accordionPreview).toHaveAttribute('data-theme', 'dark');
    await expect(tabsPreview).toHaveAttribute('data-theme', 'dark');
    await expect(dropdownTrigger).toHaveCSS(
      'background-color',
      'rgb(15, 23, 42)',
    );
    await expect(accordionTrigger).toHaveCSS(
      'background-color',
      'rgb(15, 23, 42)',
    );
    await expect(tabsSurface).toHaveCSS('background-color', 'rgb(15, 23, 42)');

    await darkToggle.uncheck();

    await expect(dropdownPreview).not.toHaveAttribute('data-theme');
    await expect(accordionPreview).not.toHaveAttribute('data-theme');
    await expect(tabsPreview).not.toHaveAttribute('data-theme');
    await expect(dropdownTrigger).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    await expect(accordionTrigger).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    await expect(tabsSurface).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
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

  test('covers explicit Persian and English digit conversion pipes', async ({
    page,
  }) => {
    await expect(page.locator('#digits-to-persian')).toHaveText(
      'Invoice ۱۲۰۳ / شماره ۴۵',
    );
    await expect(page.locator('#digits-to-english')).toHaveText('1234567890');
    await expect(page.locator('#digits-null')).toHaveText('');
    await expect(page.locator('#digits-undefined')).toHaveText('');
  });

  test('covers Unicode-aware initials for Latin, Persian, emoji, and whitespace', async ({
    page,
  }) => {
    await expect(page.locator('#initials-latin')).toHaveText('AL');
    await expect(page.locator('#initials-persian')).toHaveText('ما');
    await expect(page.locator('#initials-emoji')).toHaveText('👩‍💻S');
    await expect(page.locator('#initials-whitespace')).toHaveText('AL');
    await expect(page.locator('#initials-null')).toHaveText('');
  });

  test('covers decimal, binary, negative, and null file-size formatting', async ({
    page,
  }) => {
    await expect(page.locator('#filesize-decimal')).toHaveText('1.5 MB');
    await expect(page.locator('#filesize-binary')).toHaveText('1.5 KiB');
    await expect(page.locator('#filesize-negative')).toHaveText('-1.54 kB');
    await expect(page.locator('#filesize-null')).toHaveText('');
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
    const bodyStructure = await page.locator('body').evaluate((element) => ({
      childCount: element.children.length,
      firstChild: element.firstElementChild?.tagName,
      lastChild: element.lastElementChild?.tagName,
    }));
    const documentStructure = await page.evaluate(() => ({
      htmlChildren: [...document.documentElement.children].map(
        (element) => element.tagName,
      ),
      applicationRootChildren: [
        ...(document.body.firstElementChild?.children ?? []),
      ].map((element) => element.tagName),
      headBodyAdjacent: document.querySelector('head + body') === document.body,
      bodySecondChild: document.body.matches(':nth-child(2)'),
      bodyLastChild: document.body.matches(':last-child'),
      bodyApplicationRootOnlyChild:
        document.body.firstElementChild?.matches(':only-child') ?? false,
      mainLastChild:
        document.querySelector('app-root > main')?.matches(':last-child') ??
        false,
    }));

    await textarea.evaluate((element) => {
      element.style.lineHeight = 'normal';
    });
    await textarea.fill('Short value.');
    const initialHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    expect(
      await textarea.evaluate((element) => element.closest('app-root')),
    ).not.toBeNull();

    await textarea.evaluate((element) => {
      element.style.boxSizing = 'border-box';
      element.style.maxHeight = '120px';
      element.style.maxBlockSize = '80px';
      element.style.lineHeight = '20px';
    });
    await textarea.fill('logical block cap '.repeat(80));
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          height: element.getBoundingClientRect().height,
          overflowY: getComputedStyle(element).overflowY,
          overflowing: element.scrollHeight > element.clientHeight,
        })),
      )
      .toEqual({ height: 80, overflowY: 'auto', overflowing: true });

    await textarea.fill('fitting content');
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          height: element.getBoundingClientRect().height,
          overflowY: getComputedStyle(element).overflowY,
          overflowing: element.scrollHeight > element.clientHeight,
        })),
      )
      .toMatchObject({ overflowY: 'hidden', overflowing: false });
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeLessThan(80);

    await textarea.evaluate((element) => {
      element.style.maxBlockSize = '100px';
      element.style.maxHeight = '60px';
    });
    await textarea.fill('physical max-height wins '.repeat(80));
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          height: element.getBoundingClientRect().height,
          overflowY: getComputedStyle(element).overflowY,
        })),
      )
      .toEqual({ height: 60, overflowY: 'auto' });
    await textarea.evaluate((element) => {
      element.style.boxSizing = '';
      element.style.maxHeight = '';
      element.style.maxBlockSize = '';
    });
    await textarea.fill('Short value.');

    await textarea.evaluate((element) => {
      element.style.width = '220px';
      element.style.minWidth = '0px';
      element.style.maxWidth = '100%';
      element.style.minInlineSize = '0px';
      element.style.maxInlineSize = '100%';
      element.style.lineHeight = '20px';
    });
    await textarea.fill('width constraints '.repeat(40));
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
        })),
      )
      .toMatchObject({ width: 220 });
    await textarea.evaluate((element) => {
      element.style.width = '';
      element.style.minWidth = '';
      element.style.maxWidth = '';
      element.style.minInlineSize = '';
      element.style.maxInlineSize = '';
      element.style.lineHeight = 'normal';
    });
    await textarea.fill('Short value.');

    await textarea.evaluate((element) => {
      element.style.height = '20px';
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBe(initialHeight);
    await textarea.evaluate((element) => {
      element.style.overflowY = 'scroll';
    });
    await expect(textarea).toHaveCSS('overflow-y', 'hidden');

    const inheritedWidth = await textarea.evaluate(
      (element) => element.getBoundingClientRect().width,
    );
    await textarea.evaluate((element) => {
      element.style.lineHeight = 'var(--textarea-e2e-line-height)';
      element.parentElement!.style.setProperty(
        '--textarea-e2e-line-height',
        '20px',
      );
    });
    const inheritedHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    await textarea.evaluate((element) => {
      element.parentElement!.style.setProperty(
        '--textarea-e2e-line-height',
        '30px',
      );
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeGreaterThan(inheritedHeight);
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBe(inheritedWidth);
    await textarea.evaluate((element) => {
      element.parentElement!.style.setProperty(
        '--textarea-e2e-line-height',
        '20px',
      );
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeLessThan(96);
    await textarea.blur();
    const pseudoStateStyle = await page.addStyleTag({
      content:
        '#textarea-autosize-input:focus { padding-top: 32px; padding-bottom: 28px; border-top-width: 6px; border-bottom-width: 7px; }',
    });
    const pseudoStateWidth = await textarea.evaluate(
      (element) => element.getBoundingClientRect().width,
    );
    const pseudoStateHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    await textarea.focus();
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeGreaterThan(pseudoStateHeight);
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBe(pseudoStateWidth);
    await textarea.blur();
    await pseudoStateStyle.evaluate((element) => element.remove());
    await textarea.evaluate((element) => {
      element.parentElement!.style.setProperty(
        '--textarea-e2e-line-height',
        '20px',
      );
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeLessThan(96);
    await textarea.evaluate((element) => {
      element.style.lineHeight = 'normal';
      element.parentElement!.style.removeProperty('--textarea-e2e-line-height');
    });

    await textarea.evaluate((element) => {
      element.style.width = '220px';
      element.style.boxSizing = 'border-box';
      element.style.padding = '6px 18px';
      element.style.border = '2px solid';
      element.style.lineHeight = '20px';
      element.style.fontFamily = 'monospace';
      element.style.fontSize = '16px';
      element.value = '';
      element.setAttribute('placeholder', 'short');
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const placeholderStyle = await page.addStyleTag({
      content:
        '#textarea-autosize-input::placeholder { font-size: 28px; line-height: 36px; letter-spacing: 1px; }',
    });
    const shortPlaceholderHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    await textarea.evaluate((element) => {
      element.setAttribute('placeholder', 'Placeholder text wraps');
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeGreaterThan(shortPlaceholderHeight);
    const longPlaceholderHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    const placeholderGeometry = await textarea.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      scrollHeight: element.scrollHeight,
      borders:
        parseFloat(getComputedStyle(element).borderTopWidth) +
        parseFloat(getComputedStyle(element).borderBottomWidth),
    }));
    expect(placeholderGeometry.height).toBeGreaterThan(shortPlaceholderHeight);
    expect(placeholderGeometry.scrollHeight).toBeGreaterThan(
      await textarea.evaluate((element) => element.clientHeight),
    );
    await expect(textarea).toHaveCSS('overflow-y', 'auto');
    await textarea.fill('real value');
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeLessThan(longPlaceholderHeight);
    await textarea.evaluate((element) => {
      element.value = '';
      element.removeAttribute('placeholder');
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await placeholderStyle.evaluate((element) => element.remove());
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeLessThan(longPlaceholderHeight);
    await textarea.fill('Short value.');

    await textarea.evaluate((element) => {
      element.style.width = '220px';
      element.style.boxSizing = 'border-box';
      element.style.padding = '6px 18px';
      element.style.border = '2px solid';
      element.style.lineHeight = '20px';
      element.style.maxHeight = '60px';
    });
    await textarea.fill('css max-height '.repeat(40));
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeLessThanOrEqual(60);
    await expect(textarea).toHaveCSS('overflow-y', 'auto');
    await expect
      .poll(() =>
        textarea.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        ),
      )
      .toBe(true);
    await textarea.evaluate((element) => {
      element.style.maxHeight = '';
    });
    await textarea.evaluate((element) => {
      element.parentElement!.style.height = '160px';
      element.style.boxSizing = 'content-box';
      element.style.maxHeight = '50%';
      element.style.padding = '6px 18px';
      element.style.border = '2px solid';
      element.style.lineHeight = '20px';
    });
    await textarea.fill('percentage max-height '.repeat(40));
    await expect(textarea).toHaveCSS('overflow-y', 'auto');
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          physicalHeight: element.getBoundingClientRect().height,
          maxHeight: parseFloat(getComputedStyle(element).maxHeight),
        })),
      )
      .toEqual({ physicalHeight: 96, maxHeight: 50 });
    await textarea.evaluate((element) => {
      element.parentElement!.style.height = '80px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeLessThan(96);
    await expect(textarea).toHaveCSS('overflow-y', 'auto');
    const shrunkLayoutHeight = await textarea.evaluate(
      (element) => element.offsetHeight,
    );
    await textarea.evaluate((element) => {
      element.parentElement!.style.height = '240px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(shrunkLayoutHeight);
    for (const maxHeight of ['calc(80px - 10px)', 'var(--e2e-max-height)']) {
      await textarea.evaluate((element, value) => {
        element.style.setProperty('--e2e-max-height', '70px');
        element.style.maxHeight = value;
      }, maxHeight);
      await expect
        .poll(() =>
          textarea.evaluate((element) => ({
            physicalHeight: element.getBoundingClientRect().height,
            maxHeight: parseFloat(getComputedStyle(element).maxHeight),
            overflowY: getComputedStyle(element).overflowY,
          })),
        )
        .toEqual({ physicalHeight: 86, maxHeight: 70, overflowY: 'auto' });
    }
    await textarea.evaluate((element) => {
      element.style.maxHeight = '';
      element.parentElement!.style.height = '';
    });

    const observerMoveStyle = await page.addStyleTag({
      content: `
        [data-e2e-move-a] textarea { line-height: 20px; }
        [data-e2e-move-b] textarea { line-height: 30px; }
      `,
    });
    await textarea.evaluate((element) => {
      const originalParent = element.parentElement!;
      originalParent.setAttribute('data-e2e-original-parent', 'true');
      const first = document.createElement('div');
      first.setAttribute('data-e2e-move-a', 'true');
      first.style.width = '420px';
      const second = document.createElement('div');
      second.setAttribute('data-e2e-move-b', 'true');
      second.style.width = '420px';
      originalParent.append(first, second);
      first.append(element);
      element.style.maxHeight = '';
      element.style.position = '';
      element.style.padding = '0';
      element.style.border = '0';
      element.style.lineHeight = '';
    });
    await textarea.fill('reparented value');
    await expect(textarea).toHaveCSS('height', '40px');
    await textarea.evaluate((element) => {
      const second =
        element.parentElement!.parentElement!.querySelector(
          '[data-e2e-move-b]',
        )!;
      second.append(element);
    });
    await expect(textarea).toHaveCSS('height', '60px');

    await textarea.evaluate((element) => {
      const originalParent = document.querySelector(
        '[data-e2e-original-parent]',
      )!;
      const unchanged = document.createElement('div');
      unchanged.setAttribute('data-e2e-move-b', 'true');
      unchanged.style.width = '420px';
      originalParent.append(unchanged);
      unchanged.append(element);
    });
    await expect(textarea).toHaveCSS('height', '60px');

    await textarea.evaluate((element) => {
      const originalParent = document.querySelector(
        '[data-e2e-original-parent]',
      )!;
      const containingBlock = document.createElement('div');
      containingBlock.style.position = 'relative';
      containingBlock.style.height = '160px';
      const unpositionedWrapper = document.createElement('div');
      unpositionedWrapper.style.height = '40px';
      containingBlock.append(unpositionedWrapper);
      originalParent.append(containingBlock);
      unpositionedWrapper.append(element);
      element.style.position = 'absolute';
      element.style.maxHeight = '50%';
      element.style.lineHeight = '20px';
      element.style.padding = '0';
      element.style.border = '0';
    });
    await textarea.fill('positioned containing block '.repeat(40));
    await expect(textarea).toHaveJSProperty('offsetHeight', 80);
    await textarea.evaluate((element) => {
      element.parentElement!.parentElement!.style.height = '240px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(100);

    await textarea.evaluate((element) => {
      const originalParent = document.querySelector(
        '[data-e2e-original-parent]',
      )!;
      originalParent.prepend(element);
      originalParent
        .querySelectorAll('[data-e2e-move-a], [data-e2e-move-b]')
        .forEach((container) => container.remove());
      originalParent
        .querySelectorAll('[style*="position: relative"]')
        .forEach((container) => container.remove());
      originalParent.removeAttribute('data-e2e-original-parent');
      element.style.position = '';
      element.style.maxHeight = '';
      element.style.lineHeight = '';
      element.style.padding = '';
      element.style.border = '';
    });
    await observerMoveStyle.evaluate((element) => element.remove());
    await textarea.fill('Short value.');

    for (const transformTarget of ['textarea', 'ancestor']) {
      for (const boxSizing of ['content-box', 'border-box']) {
        await textarea.evaluate(
          (element, options) => {
            element.parentElement!.style.height = '160px';
            element.style.width = '220px';
            element.style.boxSizing = options.boxSizing;
            element.style.padding = '6px 18px';
            element.style.border = '2px solid';
            element.style.lineHeight = '20px';
            element.style.maxHeight = '50%';
            element.style.transform =
              options.transformTarget === 'textarea' ? 'scale(.5)' : '';
            element.parentElement!.style.transform =
              options.transformTarget === 'ancestor' ? 'scale(.5)' : '';
          },
          { boxSizing, transformTarget },
        );
        await textarea.fill('transformed percentage max-height '.repeat(40));
        await expect(textarea).toHaveCSS('overflow-y', 'auto');
        const geometry = await textarea.evaluate((element) => ({
          layoutHeight: element.offsetHeight,
          visualHeight: element.getBoundingClientRect().height,
        }));
        expect(geometry.layoutHeight).toBe(
          boxSizing === 'border-box' ? 80 : 96,
        );
        expect(geometry.visualHeight).toBeLessThan(geometry.layoutHeight);
      }
    }
    await textarea.evaluate((element) => {
      element.style.maxHeight = '';
      element.style.transform = '';
      element.parentElement!.style.height = '';
      element.parentElement!.style.transform = '';
    });

    for (const transformProperty of ['transform', 'scale']) {
      for (const boxSizing of ['content-box', 'border-box']) {
        await textarea.evaluate((element, nextBoxSizing) => {
          element.style.width = '220px';
          element.style.boxSizing = nextBoxSizing;
          element.style.padding = '6px 18px';
          element.style.border = '2px solid';
          element.style.lineHeight = 'normal';
          element.style.fontSize = '16px';
          element.style.setProperty('transform', 'none');
          element.style.setProperty('scale', 'none');
        }, boxSizing);
        await textarea.fill('short');
        const minHeight = await textarea.evaluate((element) =>
          parseFloat(getComputedStyle(element).height),
        );
        await textarea.evaluate((element, property) => {
          element.style.setProperty(property, 'scale(.5)');
        }, transformProperty);
        await expect
          .poll(() =>
            textarea.evaluate((element) =>
              parseFloat(getComputedStyle(element).height),
            ),
          )
          .toBe(minHeight);

        await textarea.evaluate((element, property) => {
          element.style.setProperty(property, 'none');
        }, transformProperty);
        await textarea.fill('line\n'.repeat(20));
        const maxHeight = await textarea.evaluate((element) =>
          parseFloat(getComputedStyle(element).height),
        );
        await textarea.evaluate((element, property) => {
          element.style.setProperty(property, 'scale(.5)');
        }, transformProperty);
        await expect
          .poll(() =>
            textarea.evaluate((element) =>
              parseFloat(getComputedStyle(element).height),
            ),
          )
          .toBe(maxHeight);
        await textarea.evaluate((element) => {
          element.style.setProperty('transform', 'none');
          element.style.setProperty('scale', 'none');
        });
      }
    }
    await textarea.evaluate((element) => {
      element.style.width = '';
      element.style.boxSizing = '';
      element.style.padding = '';
      element.style.border = '';
      element.style.lineHeight = 'normal';
      element.style.fontSize = '';
      element.style.fontFamily = '';
      element.style.setProperty('transform', 'none');
      element.style.setProperty('scale', 'none');
    });
    await textarea.fill('Short value.');
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

    const structure = await textarea.evaluate((element) => ({
      childCount: element.parentElement?.children.length,
      firstChild: element.matches(':first-child'),
      lastChild: element.matches(':last-child'),
    }));
    expect(structure).toEqual({
      childCount: 2,
      firstChild: true,
      lastChild: false,
    });
    expect(
      await page.evaluate(() => ({
        htmlChildren: [...document.documentElement.children].map(
          (element) => element.tagName,
        ),
        applicationRootChildren: [
          ...(document.body.firstElementChild?.children ?? []),
        ].map((element) => element.tagName),
        headBodyAdjacent:
          document.querySelector('head + body') === document.body,
        bodySecondChild: document.body.matches(':nth-child(2)'),
        bodyLastChild: document.body.matches(':last-child'),
        bodyApplicationRootOnlyChild:
          document.body.firstElementChild?.matches(':only-child') ?? false,
        mainLastChild:
          document.querySelector('app-root > main')?.matches(':last-child') ??
          false,
      })),
    ).toEqual(documentStructure);
    await expect(
      page.locator('div[aria-hidden="true"][style*="-100000px"]'),
    ).toHaveCount(0);

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

    const wrapBoundaryValue = '1234567890123456789012345678901234567890';
    const structuralStyle = await page.addStyleTag({
      content:
        '#textarea-autosize-input:first-child { font-family: monospace; }',
    });
    const layoutDifference = async (): Promise<number> =>
      textarea.evaluate((element) => {
        const styles = getComputedStyle(element);
        const padding =
          parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
        const borders =
          parseFloat(styles.borderTopWidth) +
          parseFloat(styles.borderBottomWidth);
        const height = parseFloat(styles.height);
        const expected =
          styles.boxSizing === 'border-box'
            ? element.scrollHeight + borders
            : element.scrollHeight - padding;
        return Math.abs(height - expected);
      });
    for (const boxSizing of ['content-box', 'border-box']) {
      await textarea.evaluate((element, nextBoxSizing) => {
        element.style.width = '220px';
        element.style.boxSizing = nextBoxSizing;
        element.style.padding = '6px 18px';
        element.style.border = '2px solid';
        element.style.lineHeight = '20px';
        element.style.fontSize = '16px';
      }, boxSizing);
      await textarea.fill(wrapBoundaryValue);
      await expect.poll(layoutDifference).toBeLessThan(1);
    }

    for (const overflowX of ['scroll', 'auto', 'hidden'] as const) {
      await textarea.evaluate((element, mode) => {
        element.style.width = '220px';
        element.style.boxSizing = 'content-box';
        element.style.padding = '6px 18px';
        element.style.border = '2px solid';
        element.style.lineHeight = '20px';
        element.style.maxHeight = '80px';
        element.style.overflowX = mode;
        element.setAttribute('wrap', 'off');
      }, overflowX);
      await textarea.fill(
        overflowX === 'hidden'
          ? 'short'
          : `${'line\n'.repeat(10)}${'0123456789'.repeat(40)}`,
      );
      if (overflowX === 'hidden') {
        await expect(textarea).toHaveCSS('overflow-y', 'hidden');
        continue;
      }

      await expect
        .poll(() =>
          textarea.evaluate((element) => ({
            horizontalOverflow: element.scrollWidth > element.clientWidth,
            physicalHeight: element.getBoundingClientRect().height,
            cssHeight: parseFloat(getComputedStyle(element).height),
            scrollable: getComputedStyle(element).overflowY,
          })),
        )
        .toMatchObject({
          horizontalOverflow: true,
          scrollable: 'auto',
        });
      const maxGeometry = await textarea.evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          physicalHeight: element.getBoundingClientRect().height,
          cssHeight: parseFloat(styles.height),
          maxHeight: parseFloat(styles.maxHeight),
          padding:
            parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom),
          borders:
            parseFloat(styles.borderTopWidth) +
            parseFloat(styles.borderBottomWidth),
        };
      });
      expect(maxGeometry.cssHeight).toBeLessThanOrEqual(
        maxGeometry.maxHeight + 1,
      );
      expect(maxGeometry.physicalHeight).toBeLessThanOrEqual(
        maxGeometry.maxHeight + maxGeometry.padding + maxGeometry.borders + 1,
      );
    }
    await textarea.evaluate((element) => {
      element.style.maxHeight = '';
      element.style.overflowX = '';
      element.setAttribute('wrap', 'soft');
    });

    for (const transformTarget of ['textarea', 'ancestor']) {
      for (const boxSizing of ['content-box', 'border-box']) {
        await textarea.evaluate(
          (element, options) => {
            element.style.width = '220px';
            element.style.boxSizing = options.boxSizing;
            element.style.padding = '6px 18px';
            element.style.border = '2px solid';
            element.style.lineHeight = '20px';
            element.style.fontSize = '16px';
            if (options.transformTarget === 'textarea') {
              element.style.transform = 'scale(.5)';
            } else {
              element.parentElement!.style.transform = 'scale(.5)';
            }
          },
          { boxSizing, transformTarget },
        );
        await textarea.fill(wrapBoundaryValue);
        await expect.poll(layoutDifference).toBeLessThan(1);
        await textarea.evaluate((element) => {
          element.style.transform = '';
          element.parentElement!.style.transform = '';
        });
      }
    }

    const boxSizingStyle = await page.addStyleTag({
      content: `
        #textarea-autosize-input.box-sizing-content { box-sizing: content-box; }
        #textarea-autosize-input.box-sizing-border { box-sizing: border-box; }
      `,
    });
    const physicalHeightDifference = async (): Promise<number> =>
      textarea.evaluate((element) => {
        const styles = getComputedStyle(element);
        const borders =
          parseFloat(styles.borderTopWidth) +
          parseFloat(styles.borderBottomWidth);
        return Math.abs(
          element.getBoundingClientRect().height -
            (element.scrollHeight + borders),
        );
      });
    await textarea.evaluate((element) => {
      element.style.width = '220px';
      element.style.padding = '6px 18px';
      element.style.border = '2px solid';
      element.style.lineHeight = '20px';
      element.style.fontSize = '16px';
      element.style.boxSizing = '';
      element.classList.add('box-sizing-content');
      element.classList.remove('box-sizing-border');
    });
    await textarea.fill('short');
    await expect.poll(physicalHeightDifference).toBeLessThan(1);
    await expect(textarea).toHaveCSS('box-sizing', 'content-box');

    await textarea.evaluate((element) => {
      element.classList.remove('box-sizing-content');
      element.classList.add('box-sizing-border');
    });
    await expect.poll(physicalHeightDifference).toBeLessThan(1);
    await expect(textarea).toHaveCSS('box-sizing', 'border-box');

    await textarea.evaluate((element) => {
      element.classList.remove('box-sizing-border');
      element.classList.add('box-sizing-content');
    });
    await expect.poll(physicalHeightDifference).toBeLessThan(1);
    await expect(textarea).toHaveCSS('box-sizing', 'content-box');

    const longWrapValue = 'wrap '.repeat(100);
    await textarea.evaluate((element) => {
      element.classList.remove('box-sizing-content', 'box-sizing-border');
      element.style.boxSizing = 'border-box';
      element.setAttribute('wrap', 'off');
    });
    await textarea.fill(longWrapValue);
    const offWrapHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    await textarea.evaluate((element) => {
      element.setAttribute('wrap', 'soft');
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeGreaterThan(offWrapHeight);

    await textarea.evaluate((element) => {
      element.setAttribute('wrap', 'off');
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBe(offWrapHeight);

    for (const wrap of ['OFF', 'Off', 'oFf']) {
      await textarea.evaluate((element, nextWrap) => {
        element.setAttribute('wrap', nextWrap);
      }, wrap);
      await expect
        .poll(() =>
          textarea.evaluate(
            (element) => element.getBoundingClientRect().height,
          ),
        )
        .toBe(offWrapHeight);
    }
    await textarea.evaluate((element) => element.removeAttribute('wrap'));
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeGreaterThan(offWrapHeight);
    await textarea.evaluate((element) => element.setAttribute('wrap', 'hard'));
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeGreaterThan(offWrapHeight);
    await textarea.evaluate((element) => element.setAttribute('wrap', 'soft'));

    const horizontalValue = '0123456789'.repeat(40);
    for (const boxSizing of ['content-box', 'border-box']) {
      await textarea.evaluate((element, nextBoxSizing) => {
        element.style.width = '220px';
        element.style.boxSizing = nextBoxSizing;
        element.style.padding = '6px 18px';
        element.style.border = '2px solid';
        element.style.lineHeight = '20px';
        element.style.fontSize = '16px';
        element.style.overflowX = 'auto';
        element.setAttribute('wrap', 'off');
      }, boxSizing);
      await textarea.fill(horizontalValue);
      await expect
        .poll(() =>
          textarea.evaluate(
            (element) => element.scrollWidth > element.clientWidth,
          ),
        )
        .toBe(true);
      await expect
        .poll(() =>
          textarea.evaluate((element) => {
            const styles = getComputedStyle(element);
            const borders =
              parseFloat(styles.borderTopWidth) +
              parseFloat(styles.borderBottomWidth);
            const gutter = Math.max(
              0,
              element.offsetHeight - element.clientHeight - borders,
            );
            const expected = element.scrollHeight + borders + gutter;
            return Math.abs(element.getBoundingClientRect().height - expected);
          }),
        )
        .toBeLessThan(1);
    }
    await boxSizingStyle.evaluate((element) => element.remove());

    const metricsStyle = await page.addStyleTag({
      content: `
        #textarea-autosize-input.metrics-regression {
          padding-top: 22px;
          padding-bottom: 24px;
          border-top-width: 5px;
          border-bottom-width: 6px;
        }
      `,
    });
    await textarea.evaluate((element) => {
      element.style.width = '';
      element.style.boxSizing = 'border-box';
      element.style.padding = '';
      element.style.border = '';
      element.style.lineHeight = '20px';
      element.style.fontFamily = 'monospace';
      element.style.fontSize = '16px';
      element.value = 'short';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const beforeClassHeight = await textarea.evaluate((element) =>
      parseFloat(getComputedStyle(element).height),
    );
    await textarea.evaluate((element) => {
      element.classList.add('metrics-regression');
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) =>
          parseFloat(getComputedStyle(element).height),
        ),
      )
      .toBeGreaterThan(beforeClassHeight);

    await textarea.evaluate((element) => {
      element.style.fontSize = '';
      element.style.lineHeight = 'normal';
      element.style.width = '';
      element.style.boxSizing = '';
      element.style.padding = '';
      element.style.border = '';
      element.style.fontFamily = '';
      element.classList.remove('metrics-regression');
      element.removeAttribute('wrap');
    });
    await structuralStyle.evaluate((element) => element.remove());
    await metricsStyle.evaluate((element) => element.remove());

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

    await textarea.fill(
      'current value that is long enough to autosize before reset '.repeat(20),
    );
    const beforeResetHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    await textarea.evaluate((element) => {
      element.defaultValue = 'reset default';
    });
    await page.locator('#textarea-autosize-reset').evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    await expect(textarea).toHaveValue('reset default');
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeLessThan(beforeResetHeight);

    const dynamicValue = 'dynamic reassociation value '.repeat(20);
    await textarea.fill(dynamicValue);
    const dynamicLongHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    await textarea.evaluate((element) => {
      element.defaultValue = 'dynamic form B default';
      element.setAttribute('form', 'textarea-autosize-form-b');
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.form?.id ?? null))
      .toBe('textarea-autosize-form-b');
    await page.locator('#textarea-autosize-reset').evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    await expect(textarea).toHaveValue(dynamicValue);
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBe(dynamicLongHeight);
    await page.locator('#textarea-autosize-reset-b').evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    await expect(textarea).toHaveValue('dynamic form B default');
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeLessThan(dynamicLongHeight);

    await textarea.fill(dynamicValue);
    await textarea.evaluate((element) => {
      element.defaultValue = 'unassociated default';
      element.removeAttribute('form');
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.form?.id ?? null))
      .toBe(null);
    await page.locator('#textarea-autosize-reset-b').evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    await expect(textarea).toHaveValue(dynamicValue);
    await textarea.evaluate((element) => {
      element.setAttribute('form', 'textarea-autosize-form');
    });

    await enabled.uncheck();
    await expect(
      page.locator('div[aria-hidden="true"][style*="-100000px"]'),
    ).toHaveCount(0);
    const bodyStructureAfterDisable = await page
      .locator('body')
      .evaluate((element) => ({
        childCount: element.children.length,
        firstChild: element.firstElementChild?.tagName,
        lastChild: element.lastElementChild?.tagName,
      }));
    expect(bodyStructureAfterDisable).toEqual(bodyStructure);
    await page.locator('#textarea-autosize-long').click();
    await expect(textarea).toHaveCSS('height', `${initialHeight}px`);

    await enabled.check();
    await expect(
      page.locator('div[aria-hidden="true"][style*="-100000px"]'),
    ).toHaveCount(0);
    const bodyStructureAfter = await page
      .locator('body')
      .evaluate((element) => ({
        childCount: element.children.length,
        firstChild: element.firstElementChild?.tagName,
        lastChild: element.lastElementChild?.tagName,
      }));
    expect(bodyStructureAfter).toEqual(bodyStructure);
    expect(
      await page.evaluate(() => ({
        htmlChildren: [...document.documentElement.children].map(
          (element) => element.tagName,
        ),
        applicationRootChildren: [
          ...(document.body.firstElementChild?.children ?? []),
        ].map((element) => element.tagName),
        headBodyAdjacent:
          document.querySelector('head + body') === document.body,
        bodySecondChild: document.body.matches(':nth-child(2)'),
        bodyLastChild: document.body.matches(':last-child'),
        bodyApplicationRootOnlyChild:
          document.body.firstElementChild?.matches(':only-child') ?? false,
        mainLastChild:
          document.querySelector('app-root > main')?.matches(':last-child') ??
          false,
      })),
    ).toEqual(documentStructure);
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeGreaterThan(initialHeight);
  });

  test('remeasures textarea autosize for real hash navigation and :target changes', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await page.addStyleTag({
      content: `
        #e2e-textarea-hash-target textarea { line-height: 20px; }
        #e2e-textarea-hash-target:target textarea { line-height: 30px; }
      `,
    });
    await textarea.evaluate((element) => {
      element.parentElement!.id = 'e2e-textarea-hash-target';
      element.style.minHeight = '0';
      element.style.padding = '0';
      element.style.border = '0';
      element.value = 'hash target measurement';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const initialHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    expect(initialHeight).toBe(40);

    await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = '#e2e-textarea-hash-target';
      link.textContent = 'Navigate to textarea target';
      document.body.append(link);
      link.click();
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(60);

    await page.evaluate(() => {
      location.hash = '';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(40);
  });

  test('preserves :target state for pushState and replaceState fragments', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await page.addStyleTag({
      content: `
        #e2e-history-target textarea { line-height: 20px; }
        #e2e-history-target:target textarea { line-height: 30px; }
      `,
    });
    await textarea.evaluate((element) => {
      element.parentElement!.id = 'e2e-history-target';
      element.style.minHeight = '0';
      element.style.padding = '0';
      element.style.border = '0';
      element.value = 'history target measurement';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(40);

    await textarea.evaluate((element) => {
      history.pushState(null, '', '#e2e-history-target');
      if (element.parentElement!.matches(':target')) {
        throw new Error('pushState unexpectedly activated :target');
      }
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(40);

    await textarea.evaluate((element) => {
      history.replaceState(null, '', '#e2e-history-away');
      if (element.parentElement!.matches(':target')) {
        throw new Error('replaceState unexpectedly activated :target');
      }
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(40);
  });

  test('resolves relative caps despite stylesheet-important height', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const enabled = page.locator('#textarea-autosize-enabled');
    const style = await page.addStyleTag({
      content: '.e2e-important-relative-cap { height: 40px !important; }',
    });
    await textarea.evaluate((element) => {
      const parent = element.parentElement!;
      parent.style.height = '160px';
      parent.style.position = 'relative';
      element.classList.add('e2e-important-relative-cap');
      element.style.minHeight = '0';
      element.style.padding = '0';
      element.style.border = '0';
      element.style.lineHeight = '20px';
      element.style.maxHeight = '50%';
      element.value = 'relative cap '.repeat(80);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const geometry = await textarea.evaluate((element) => ({
      height: element.offsetHeight,
      cssHeight: getComputedStyle(element).height,
      maxHeight: getComputedStyle(element).maxHeight,
      parentHeight: element.parentElement!.getBoundingClientRect().height,
    }));
    expect(geometry).toEqual({
      height: 80,
      cssHeight: '80px',
      maxHeight: '50%',
      parentHeight: 160,
    });

    await enabled.uncheck();
    await expect(textarea).toHaveCSS('height', '40px');
    await style.evaluate((element) => element.remove());
  });

  test('textarea autosize clears stale vertical overflow before wrap-off gutter measurement', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await textarea.evaluate((element) => {
      element.style.width = '200px';
      element.style.boxSizing = 'border-box';
      element.style.padding = '0';
      element.style.border = '0';
      element.style.lineHeight = '20px';
      element.style.maxHeight = '60px';
      element.style.overflowX = 'auto';
      element.style.setProperty('overflow-y', 'scroll', 'important');
      element.setAttribute('wrap', 'off');
      element.value = `${'01234567890123456789'}\n${'line\n'.repeat(10)}`;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(textarea).toHaveCSS('overflow-y', 'auto');
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(60);

    const shortValue = '01234567890123456789';
    await textarea.fill(shortValue);
    await expect(textarea).toHaveCSS('overflow-y', 'hidden');
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(40);
    await expect
      .poll(() =>
        textarea.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      )
      .toBe(true);

    await textarea.fill(`${shortValue}\n${'line\n'.repeat(10)}`);
    await expect(textarea).toHaveCSS('overflow-y', 'auto');
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(60);
  });

  test('remeasures ancestor focus-within metrics and synchronizes font-size-adjust', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const style = await page.addStyleTag({
      content: `
        .e2e-focus-within-shell textarea { line-height: 20px; }
        .e2e-focus-within-shell:focus-within textarea { line-height: 30px; }
      `,
    });
    const initial = await textarea.evaluate((element) => {
      element.parentElement!.classList.add('e2e-focus-within-shell');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'focus sibling';
      element.parentElement!.append(button);
      element.value = 'unchanged value';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return {
        value: element.value,
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
      };
    });
    const button = textarea
      .locator('xpath=..')
      .getByRole('button', { name: 'focus sibling' });
    await button.focus();
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeGreaterThan(initial.height);
    await expect(textarea).toHaveValue(initial.value);
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBe(initial.width);

    const realFontSizeAdjust = await textarea.evaluate((element) => {
      element.style.fontSizeAdjust = '0.5';
      element.style.fontSize = '20px';
      element.style.lineHeight = 'normal';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return getComputedStyle(element).fontSizeAdjust;
    });
    await expect
      .poll(() =>
        textarea.evaluate(
          (element) => getComputedStyle(element).fontSizeAdjust,
        ),
      )
      .toBe(realFontSizeAdjust);
    await textarea.evaluate((element) => {
      element.style.fontSizeAdjust = '1.5';
    });
    await expect
      .poll(() =>
        textarea.evaluate(
          (element) => getComputedStyle(element).fontSizeAdjust,
        ),
      )
      .toBe('1.5');
    await style.evaluate((element) => element.remove());
  });

  test('textarea autosize remeasures real ancestor hover typography and ignores unchanged pointer transitions', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const style = await page.addStyleTag({
      content: `
        .e2e-hover-shell textarea { line-height: 20px !important; }
        .e2e-hover-shell:hover textarea { line-height: 30px !important; }
      `,
    });
    const initial = await textarea.evaluate((element) => {
      element.parentElement!.classList.add('e2e-hover-shell');
      element.style.minHeight = '0';
      element.style.maxHeight = 'none';
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return element.getBoundingClientRect().height;
    });
    const shell = textarea.locator('xpath=..');
    await expect(shell).toBeVisible();
    await shell.hover();
    await expect
      .poll(() =>
        textarea.evaluate((element) => getComputedStyle(element).lineHeight),
      )
      .toBe('30px');
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeGreaterThan(initial);

    await page.mouse.move(2, 2);
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBe(initial);

    await page.mouse.move(2, 2);
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBe(initial);
    await style.evaluate((element) => element.remove());
  });

  test('textarea autosize remeasures keyboard-driven form state changes', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const style = await page.addStyleTag({
      content: `
        .e2e-form-state-shell textarea { line-height: 20px !important; }
        .e2e-form-state-shell:has(input:checked) textarea { line-height: 32px !important; }
      `,
    });
    await textarea.evaluate((element) => {
      const originalParent = element.parentElement!;
      const shell = document.createElement('div');
      shell.className = 'e2e-form-state-shell';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.setAttribute('aria-label', 'Metric state');
      shell.append(checkbox, element);
      originalParent.append(shell);
      element.style.minHeight = '0';
      element.style.maxHeight = 'none';
      element.value = 'keyboard form state';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const checkbox = page.getByRole('checkbox', { name: 'Metric state' });
    const initial = await textarea.evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      value: element.value,
      height: element.offsetHeight,
    }));
    await checkbox.focus();
    await page.keyboard.press('Space');
    await expect(checkbox).toBeChecked();
    await expect
      .poll(() =>
        textarea.evaluate((element) => getComputedStyle(element).lineHeight),
      )
      .toBe('32px');
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(initial.height);
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          width: element.getBoundingClientRect().width,
          value: element.value,
        })),
      )
      .toEqual({ width: initial.width, value: initial.value });

    await page.keyboard.press('Space');
    await expect(checkbox).not.toBeChecked();
    await expect
      .poll(() =>
        textarea.evaluate((element) => getComputedStyle(element).lineHeight),
      )
      .toBe('20px');
    await expect(textarea).toHaveValue(initial.value);
    await style.evaluate((element) => element.remove());
    await textarea.evaluate((element) => element.parentElement?.remove());
  });

  test('textarea autosize reaches final textarea and ancestor transition metrics', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const style = await page.addStyleTag({
      content: `
        .e2e-autosize-transition-ancestor {
          line-height: 20px;
          transition: line-height 120ms linear;
        }
        .e2e-autosize-transition-ancestor.final {
          line-height: 40px;
        }
      `,
    });

    try {
      const initial = await textarea.evaluate((element) => {
        const target = element as HTMLTextAreaElement;
        target.value = 'first line\\nsecond line';
        target.style.minHeight = '0';
        target.style.maxHeight = 'none';
        target.style.maxBlockSize = 'none';
        target.style.lineHeight = '20px';
        target.style.transition = 'line-height 120ms linear';
        target.dispatchEvent(new Event('input', { bubbles: true }));
        return target.getBoundingClientRect().height;
      });

      await textarea.evaluate((element) => {
        (element as HTMLTextAreaElement).style.lineHeight = '30px';
      });
      await expect
        .poll(() =>
          textarea.evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).lineHeight),
          ),
        )
        .toBe(30);
      await expect
        .poll(() =>
          textarea.evaluate(
            (element) => element.getBoundingClientRect().height,
          ),
        )
        .toBeGreaterThan(initial);
      const textareaFinalHeight = await textarea.evaluate(
        (element) => element.getBoundingClientRect().height,
      );

      await textarea.evaluate((element) => {
        const target = element as HTMLTextAreaElement;
        target.style.lineHeight = 'inherit';
        target.style.transition = 'none';
        const ancestor = element.parentElement!;
        ancestor.classList.add('e2e-autosize-transition-ancestor');
      });
      await expect
        .poll(() =>
          textarea.evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).lineHeight),
          ),
        )
        .toBe(20);
      await textarea.evaluate((element) => {
        element.parentElement!.classList.add('final');
      });
      await expect
        .poll(() =>
          textarea.evaluate(
            (element) => element.getBoundingClientRect().height,
          ),
        )
        .toBeGreaterThan(textareaFinalHeight);

      await textarea.evaluate((element) => {
        const target = element as HTMLTextAreaElement;
        target.style.transition = 'font-size 120ms linear';
        target.style.lineHeight = '1.2';
        target.style.fontSize = '16px';
      });
      const beforeFontTransition = await textarea.evaluate(
        (element) => element.getBoundingClientRect().height,
      );
      await textarea.evaluate((element) => {
        (element as HTMLTextAreaElement).style.fontSize = '28px';
      });
      await expect
        .poll(() =>
          textarea.evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).fontSize),
          ),
        )
        .toBe(28);
      await expect
        .poll(() =>
          textarea.evaluate(
            (element) => element.getBoundingClientRect().height,
          ),
        )
        .toBeGreaterThan(beforeFontTransition);
    } finally {
      await style.evaluate((element) => element.remove());
    }
  });

  test('textarea autosize reaches the final max-height transition constraint', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await textarea.evaluate((element) => {
      const target = element as HTMLTextAreaElement;
      target.style.minHeight = '0';
      target.style.maxHeight = '40px';
      target.style.maxBlockSize = 'none';
      target.style.lineHeight = '20px';
      target.value = 'max-height transition '.repeat(100);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const initialHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    expect(initialHeight).toBeLessThanOrEqual(40);

    await textarea.evaluate((element) => {
      const target = element as HTMLTextAreaElement;
      target.style.transition = 'max-height 120ms linear';
      target.style.maxHeight = '100px';
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).maxHeight),
        ),
      )
      .toBe(100);
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(initialHeight);

    await textarea.evaluate((element) => {
      const target = element as HTMLTextAreaElement;
      target.style.maxHeight = '30px';
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).maxHeight),
        ),
      )
      .toBe(30);
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeLessThanOrEqual(30);
  });

  test('textarea autosize preserves the caret while editing in the middle', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await textarea.evaluate((element) => {
      element.style.lineHeight = 'normal';
      element.value = 'text before the insertion point';
      element.focus();
      element.setSelectionRange(11, 11, 'none');
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await textarea.press('X');
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          value: element.value,
          selectionStart: element.selectionStart,
          selectionEnd: element.selectionEnd,
        })),
      )
      .toEqual({
        value: 'text beforeX the insertion point',
        selectionStart: 12,
        selectionEnd: 12,
      });
  });

  test('textarea autosize does not write the live value during composition', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const state = await textarea.evaluate((element) => {
      const valueDescriptor = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value',
      )!;
      let writes = 0;
      Object.defineProperty(element, 'value', {
        configurable: true,
        get: () => valueDescriptor.get!.call(element),
        set: (value: string) => {
          writes += 1;
          valueDescriptor.set!.call(element, value);
        },
      });
      element.style.lineHeight = 'normal';
      element.setAttribute('placeholder', 'Compose here');
      valueDescriptor.set!.call(element, 'before after');
      element.focus();
      element.setSelectionRange(7, 7, 'none');
      element.dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true }),
      );
      valueDescriptor.set!.call(element, 'before あ after');
      element.setSelectionRange(7, 7, 'none');
      const composingInput = new InputEvent('input', {
        bubbles: true,
        isComposing: true,
      });
      element.dispatchEvent(composingInput);
      const duringComposition = {
        writes,
        value: element.value,
        selectionStart: element.selectionStart,
        placeholder: element.getAttribute('placeholder'),
      };
      writes = 0;
      element.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true }),
      );
      return { duringComposition, writesAfterEnd: writes };
    });

    expect(state.duringComposition).toEqual({
      writes: 0,
      value: 'before あ after',
      selectionStart: 7,
      placeholder: 'Compose here',
    });
    expect(state.writesAfterEnd).toBe(0);
  });

  test('textarea autosize follows definite percentage caps without collapsing auto parents', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const state = await textarea.evaluate((element) => {
      const parent = element.parentElement!;
      element.style.boxSizing = 'content-box';
      element.style.padding = '0';
      element.style.border = '0';
      element.style.lineHeight = '20px';
      element.style.maxHeight = '50%';
      element.value = 'auto parent '.repeat(100);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return {
        autoHeight: element.getBoundingClientRect().height,
        autoParentHeight: parent.getBoundingClientRect().height,
        contentReachable:
          getComputedStyle(element).overflowY === 'auto' &&
          element.scrollHeight > element.clientHeight,
      };
    });

    const repeatedHeights: number[] = [];
    for (let cycle = 0; cycle < 3; cycle += 1) {
      await textarea.dispatchEvent('input');
      repeatedHeights.push(
        await textarea.evaluate(
          (element) => element.getBoundingClientRect().height,
        ),
      );
    }
    expect(repeatedHeights.every((height) => height === state.autoHeight)).toBe(
      true,
    );
    expect(state.autoParentHeight).toBeGreaterThan(0);
    expect(state.contentReachable).toBe(true);

    await textarea.evaluate((element) => {
      element.parentElement!.style.height = '160px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(80);

    await textarea.evaluate((element) => {
      element.style.maxHeight = 'calc(50% - 10px)';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(70);

    await textarea.evaluate((element) => {
      element.style.maxHeight = '50%';
      element.parentElement!.style.height = '';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(state.autoHeight);
  });

  test('textarea autosize defers external mutations during cap resolution', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const style = await page.addStyleTag({
      content: `
        .e2e-cap-resolution-shell textarea { line-height: 20px !important; }
        .e2e-cap-resolution-shell.changed textarea { line-height: 32px !important; }
      `,
    });
    await textarea.evaluate((element) => {
      const parent = element.parentElement!;
      parent.classList.add('e2e-cap-resolution-shell');
      element.style.minHeight = '0';
      element.style.maxHeight = '50%';
      element.style.padding = '0';
      element.style.border = '0';
      const observer = new MutationObserver((records) => {
        if (
          records.some(
            (record) =>
              record.target === element &&
              record.type === 'attributes' &&
              record.attributeName === 'style',
          )
        ) {
          observer.disconnect();
          parent.classList.add('changed');
          parent.setAttribute('data-cap-resolution', 'changed');
        }
      });
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['style'],
      });
      element.value = 'deferred cap resolution '.repeat(100);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await expect
      .poll(() =>
        textarea.evaluate((element) => getComputedStyle(element).lineHeight),
      )
      .toBe('32px');
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(0);
    await textarea.evaluate((element) => element.parentElement?.remove());
    await style.evaluate((element) => element.remove());
  });

  test('textarea percentage caps follow native containing-block semantics', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const parent = textarea.locator('..');
    const style = await page.addStyleTag({
      content: `
        .textarea-cb-content-box {
          display: block;
          height: 120px;
          padding-block: 20px;
          border-block: 2px solid transparent;
          box-sizing: content-box;
        }
        .textarea-cb-border-box {
          display: block;
          height: 120px;
          padding-block: 20px;
          border-block: 2px solid transparent;
          box-sizing: border-box;
        }
        .textarea-cb-positioned {
          display: block;
          position: relative;
          height: 120px;
          padding-block: 20px;
          box-sizing: content-box;
        }
        .textarea-cb-stylesheet { display: block; height: 240px; }
        .textarea-cb-variable { display: block; height: var(--textarea-cb-height); }
        .textarea-cb-auto { display: block; height: auto; }
      `,
    });

    const measure = async () =>
      textarea.evaluate((element) => ({
        layoutHeight: element.offsetHeight,
      }));

    await textarea.evaluate((element) => {
      element.style.position = '';
      element.style.boxSizing = 'content-box';
      element.style.padding = '0';
      element.style.border = '0';
      element.style.lineHeight = '30px';
      element.style.maxHeight = '50%';
      element.value = 'native containing block '.repeat(1000);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await parent.evaluate((element) => {
      element.classList.add('textarea-cb-content-box');
    });
    await expect.poll(measure).toEqual({ layoutHeight: 60 });

    await parent.evaluate((element) => {
      element.classList.replace(
        'textarea-cb-content-box',
        'textarea-cb-border-box',
      );
    });
    await expect.poll(measure).toEqual({ layoutHeight: 38 });

    await textarea.evaluate((element) => {
      element.style.position = 'absolute';
    });
    await parent.evaluate((element) => {
      element.classList.replace(
        'textarea-cb-border-box',
        'textarea-cb-positioned',
      );
    });
    await expect.poll(measure).toEqual({ layoutHeight: 80 });

    await textarea.evaluate((element) => {
      element.style.position = '';
    });
    await parent.evaluate((element) => {
      element.classList.replace(
        'textarea-cb-positioned',
        'textarea-cb-stylesheet',
      );
    });
    expect(await parent.evaluate((element) => element.style.height)).toBe('');
    await expect.poll(measure).toEqual({ layoutHeight: 120 });

    await parent.evaluate((element) => {
      element.classList.replace(
        'textarea-cb-stylesheet',
        'textarea-cb-variable',
      );
      element.style.setProperty('--textarea-cb-height', '120px');
    });
    await expect.poll(measure).toEqual({ layoutHeight: 60 });

    await parent.evaluate((element) => {
      element.style.setProperty('--textarea-cb-height', '240px');
    });
    await expect.poll(measure).toEqual({ layoutHeight: 120 });

    await parent.evaluate((element) => {
      element.classList.replace('textarea-cb-variable', 'textarea-cb-auto');
      element.style.removeProperty('--textarea-cb-height');
    });
    const autoHeight = await textarea.evaluate(
      (element) => element.offsetHeight,
    );
    for (let cycle = 0; cycle < 3; cycle += 1) {
      await textarea.dispatchEvent('input');
      await expect
        .poll(() => textarea.evaluate((element) => element.offsetHeight))
        .toBe(autoHeight);
    }

    await style.evaluate((element) => element.remove());
  });

  test('textarea observes individual-transform positioned containing blocks', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await textarea.evaluate((element) => {
      const originalParent = element.parentElement!;
      const containingBlock = document.createElement('div');
      containingBlock.dataset.e2eIndividualTransformCb = 'true';
      containingBlock.style.cssText =
        'height: 120px; position: static; overflow: visible;';
      const wrapper = document.createElement('div');
      containingBlock.append(wrapper);
      originalParent.append(containingBlock);
      wrapper.append(element);
      element.style.position = 'absolute';
      element.style.maxHeight = '50%';
      element.style.lineHeight = '20px';
      element.style.padding = '0';
      element.style.border = '0';
      element.style.boxSizing = 'border-box';
      element.value = 'individual transform containing block '.repeat(80);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const containingBlock = page.locator('[data-e2e-individual-transform-cb]');
    for (const [property, value] of [
      ['scale', '1'],
      ['rotate', '0deg'],
      ['translate', '0'],
    ] as const) {
      await containingBlock.evaluate(
        (element, next) => element.style.setProperty(next.property, next.value),
        { property, value },
      );
      await expect
        .poll(() => textarea.evaluate((element) => element.offsetHeight))
        .toBe(60);

      await containingBlock.evaluate((element) => {
        element.style.height = '240px';
      });
      await expect
        .poll(() => textarea.evaluate((element) => element.offsetHeight))
        .toBe(120);
      await containingBlock.evaluate((element) => {
        element.style.height = '120px';
      });
    }

    await containingBlock.evaluate((element) => {
      element.style.setProperty('will-change', 'scale');
      element.style.height = '240px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(120);
    await textarea.evaluate((element) =>
      element.parentElement?.parentElement?.remove(),
    );
  });

  test('textarea follows the actual in-flow containing block through wrappers', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await textarea.evaluate((element) => {
      const originalParent = element.parentElement!;
      const containingBlock = document.createElement('div');
      containingBlock.dataset.e2eInFlowCb = 'true';
      containingBlock.style.cssText = 'height: 120px; display: block;';
      const wrapper = document.createElement('span');
      containingBlock.append(wrapper);
      originalParent.append(containingBlock);
      wrapper.append(element);
      element.style.position = '';
      element.style.maxHeight = '50%';
      element.style.lineHeight = '20px';
      element.style.padding = '0';
      element.style.border = '0';
      element.style.boxSizing = 'border-box';
      element.value = 'in-flow containing block '.repeat(80);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const containingBlock = page.locator('[data-e2e-in-flow-cb]');
    const wrapper = containingBlock.locator('span');
    for (const display of ['inline', 'contents', 'block'] as const) {
      await wrapper.evaluate((element, nextDisplay) => {
        element.style.display = nextDisplay;
      }, display);
      await expect
        .poll(() => textarea.evaluate((element) => element.offsetHeight))
        .toBe(60);
      await containingBlock.evaluate((element) => {
        element.style.height = '240px';
      });
      await expect
        .poll(() => textarea.evaluate((element) => element.offsetHeight))
        .toBe(120);
      await containingBlock.evaluate((element) => {
        element.style.height = '120px';
      });
    }
    await textarea.evaluate((element) =>
      element.parentElement?.parentElement?.remove(),
    );
  });

  test('textarea remeasures nested metric mutations by effective signature', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const style = await page.addStyleTag({
      content: `
        .e2e-nested-metric-wrapper textarea { line-height: 20px; }
        .e2e-nested-metric-wrapper:has(.state.expanded) textarea { line-height: 32px; }
      `,
    });
    await textarea.evaluate((element) => {
      const originalParent = element.parentElement!;
      const wrapper = document.createElement('div');
      wrapper.className = 'e2e-nested-metric-wrapper';
      const stateContainer = document.createElement('div');
      const state = document.createElement('span');
      state.className = 'state';
      stateContainer.append(state);
      const nestedParent = document.createElement('div');
      nestedParent.append(element);
      wrapper.append(stateContainer, nestedParent);
      originalParent.append(wrapper);
      element.style.minHeight = '0';
      element.style.width = '260px';
      element.value = 'nested metric mutation '.repeat(40);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const state = page.locator('.e2e-nested-metric-wrapper .state');
    const nestedTextarea = page.locator('.e2e-nested-metric-wrapper textarea');
    const initial = await nestedTextarea.evaluate((element) => ({
      width: element.offsetWidth,
      height: element.offsetHeight,
      lineHeight: getComputedStyle(element).lineHeight,
    }));
    await state.evaluate((element) => element.classList.add('expanded'));
    await expect
      .poll(() =>
        nestedTextarea.evaluate((element) => ({
          width: element.offsetWidth,
          height: element.offsetHeight,
          lineHeight: getComputedStyle(element).lineHeight,
        })),
      )
      .toMatchObject({ width: initial.width, lineHeight: '32px' });
    expect(
      await nestedTextarea.evaluate((element) => element.offsetHeight),
    ).toBeGreaterThan(initial.height);

    const expanded = await nestedTextarea.evaluate(
      (element) => element.offsetHeight,
    );
    await state.evaluate((element) =>
      element.append(document.createElement('i')),
    );
    await expect
      .poll(() => nestedTextarea.evaluate((element) => element.offsetHeight))
      .toBe(expanded);
    expect(
      await nestedTextarea.evaluate((element) => element.offsetWidth),
    ).toBe(initial.width);
    await style.evaluate((element) => element.remove());
    await textarea.evaluate((element) =>
      element.parentElement?.parentElement?.remove(),
    );
  });

  test('textarea autosize overrides stylesheet-important sizing while owned', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const style = await page.addStyleTag({
      content: `
        .e2e-important-sizing {
          height: 40px !important;
          overflow-y: auto !important;
        }
      `,
    });
    await textarea.evaluate((element) => {
      element.classList.add('e2e-important-sizing');
      element.style.minHeight = '0';
      element.style.maxHeight = '60px';
      element.style.lineHeight = '20px';
      element.value = 'stylesheet important sizing '.repeat(80);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(60);
    await expect(textarea).toHaveCSS('overflow-y', 'auto');
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          height: element.style.height,
          heightPriority: element.style.getPropertyPriority('height'),
          overflowPriority: element.style.getPropertyPriority('overflow-y'),
        })),
      )
      .toEqual({
        height: '60px',
        heightPriority: 'important',
        overflowPriority: 'important',
      });
    await page.locator('#textarea-autosize-enabled').uncheck();
    await expect(textarea).toHaveCSS('height', '40px');
    await expect(textarea).toHaveCSS('overflow-y', 'auto');
    await style.evaluate((element) => element.remove());
  });

  test('textarea percentage caps reject unresolved relative container heights', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await textarea.evaluate((element) => {
      const outer = document.createElement('div');
      outer.style.width = '300px';
      const container = document.createElement('div');
      container.dataset.e2eRelativeContainer = 'true';
      container.style.height = '50%';
      document.body.append(outer);
      outer.append(container);
      container.append(element);
      element.style.minHeight = '0';
      element.style.maxHeight = '50%';
      element.style.lineHeight = '20px';
      element.style.padding = '0';
      element.style.border = '0';
      element.value = 'indefinite relative cap\n'.repeat(30);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const textareaHeight = () =>
      textarea.evaluate((element) => element.offsetHeight);
    const initialHeight = await textareaHeight();
    expect(initialHeight).toBeGreaterThanOrEqual(100);

    for (let cycle = 0; cycle < 3; cycle += 1) {
      await textarea.evaluate((element, suffix) => {
        element.value = `indefinite relative cap\n${'line\n'.repeat(30)}${'x'.repeat(suffix)}`;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }, cycle);
      await expect.poll(textareaHeight).toBe(initialHeight);
    }

    const container = page.locator('[data-e2e-relative-container]');
    const outer = container.locator('..');
    await outer.evaluate((element) => {
      (element as HTMLElement).style.height = '400px';
    });
    await expect.poll(textareaHeight).toBe(100);

    await outer.evaluate((element) => {
      (element as HTMLElement).style.height = '';
    });
    await expect.poll(textareaHeight).toBe(initialHeight);

    await textarea.evaluate((element) => element.parentElement?.remove());
  });

  test('textarea percentage caps preserve native content and border box geometry', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const parent = textarea.locator('..');
    await textarea.evaluate((element) => {
      element.style.minHeight = '0';
      element.style.lineHeight = '20px';
      element.style.padding = '10px 0';
      element.style.border = '2px solid';
      element.style.maxHeight = '50%';
      element.style.maxBlockSize = '';
      element.style.boxSizing = 'content-box';
    });
    await parent.evaluate((element) => {
      element.style.height = '120px';
      element.style.display = 'block';
      element.style.position = 'relative';
    });
    await textarea.fill('content-box percentage cap '.repeat(100));
    await expect
      .poll(() =>
        textarea.evaluate((element) => {
          const styles = getComputedStyle(element);
          return {
            cssHeight: parseFloat(styles.height),
            physicalHeight: element.getBoundingClientRect().height,
            maxHeight: parseFloat(styles.maxHeight),
            padding:
              parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom),
            borders:
              parseFloat(styles.borderTopWidth) +
              parseFloat(styles.borderBottomWidth),
          };
        }),
      )
      .toEqual({
        cssHeight: 60,
        physicalHeight: 84,
        maxHeight: 60,
        padding: 20,
        borders: 4,
      });

    await textarea.evaluate((element) => {
      element.style.boxSizing = 'border-box';
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          cssHeight: parseFloat(getComputedStyle(element).height),
          physicalHeight: element.getBoundingClientRect().height,
          maxHeight: parseFloat(getComputedStyle(element).maxHeight),
        })),
      )
      .toEqual({ cssHeight: 60, physicalHeight: 60, maxHeight: 60 });

    await textarea.evaluate((element) => {
      element.style.maxHeight = '';
      element.style.maxBlockSize = '50%';
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          cssHeight: parseFloat(getComputedStyle(element).height),
          physicalHeight: element.getBoundingClientRect().height,
          maxBlockSize: parseFloat(
            getComputedStyle(element).getPropertyValue('max-block-size'),
          ),
        })),
      )
      .toEqual({ cssHeight: 60, physicalHeight: 60, maxBlockSize: 60 });
  });

  test('textarea autosize preserves content-box conversion for relative caps', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const parent = textarea.locator('..');
    await parent.evaluate((element) => {
      element.style.height = '120px';
      element.style.display = 'block';
      element.style.position = 'relative';
    });
    await textarea.evaluate((element) => {
      element.style.minHeight = '0';
      element.style.position = 'absolute';
      element.style.lineHeight = '20px';
      element.style.paddingBlock = '20px';
      element.style.borderBlock = '2px solid';
      element.style.boxSizing = 'content-box';
      element.style.maxHeight = 'calc(50% - 10px)';
      element.style.maxBlockSize = 'none';
      element.value = 'relative cap\none\nthree';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          cssHeight: parseFloat(getComputedStyle(element).height),
          physicalHeight: element.getBoundingClientRect().height,
          overflowY: getComputedStyle(element).overflowY,
        })),
      )
      .toEqual({ cssHeight: 60, physicalHeight: 104, overflowY: 'hidden' });

    await textarea.evaluate((element) => {
      element.style.maxHeight = '';
      element.style.maxBlockSize = 'calc(50% - 10px)';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(94);

    await textarea.evaluate((element) => {
      element.style.boxSizing = 'border-box';
      element.style.maxHeight = 'calc(50% - 10px)';
      element.style.maxBlockSize = 'none';
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => ({
          cssHeight: parseFloat(getComputedStyle(element).height),
          physicalHeight: element.getBoundingClientRect().height,
        })),
      )
      .toEqual({ cssHeight: 104, physicalHeight: 104 });
  });

  test('textarea autosize reconnects ordinary wrapper reparenting', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await page.addStyleTag({
      content: `
        .e2e-reparent-a { line-height: 20px; }
        .e2e-reparent-b { line-height: 30px; }
      `,
    });
    const moveWrapper = async (nested: boolean) =>
      textarea.evaluate((element, isNested) => {
        const oldParent = element.parentElement!;
        const wrapper = document.createElement('div');
        if (isNested) {
          const inner = document.createElement('div');
          inner.append(element);
          wrapper.append(inner);
        } else {
          wrapper.append(element);
        }
        oldParent.append(wrapper);
      }, nested);

    await textarea.evaluate((element) => {
      const parent = element.parentElement!;
      parent.classList.add('e2e-reparent-a');
      const newParent = document.createElement('div');
      newParent.className = 'e2e-reparent-b';
      newParent.style.width = '220px';
      document.body.append(newParent);
      element.style.minHeight = '0';
      element.value = 'wrapper reparent '.repeat(20);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await moveWrapper(false);
    await textarea.evaluate((element) => {
      document.querySelector('.e2e-reparent-b')!.append(element.parentElement!);
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(0);
    const movedHeight = await textarea.evaluate(
      (element) => element.offsetHeight,
    );
    await textarea.evaluate((element) => {
      const parent = element.parentElement!.parentElement!;
      parent.style.lineHeight = '40px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(movedHeight);

    await textarea.evaluate((element) => {
      const oldParent = document.querySelector('.e2e-reparent-a')!;
      oldParent.append(element.parentElement!);
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(0);

    await moveWrapper(true);
    await textarea.evaluate((element) => {
      document
        .querySelector('.e2e-reparent-b')!
        .append(element.parentElement!.parentElement!);
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(0);
    await textarea.evaluate((element) => {
      const oldParent = document.querySelector('.e2e-reparent-a')!;
      const outer = element.parentElement!.parentElement!;
      oldParent.append(outer);
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(0);
  });

  test('textarea autosize reconnects moves within its ShadowRoot', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const initialHeight = await textarea.evaluate((element) => {
      const target = element as HTMLTextAreaElement;
      const host = document.createElement('div');
      host.style.lineHeight = '20px';
      const shadow = host.attachShadow({ mode: 'open' });
      target.style.minHeight = '0';
      target.style.lineHeight = 'inherit';
      target.style.maxHeight = 'none';
      target.value = 'shadow reparent '.repeat(30);
      shadow.append(target);
      document.body.append(host);
      target.dispatchEvent(new Event('input', { bubbles: true }));
      return target.offsetHeight;
    });
    await textarea.evaluate((element) => {
      const target = element as HTMLTextAreaElement;
      const shadow = target.getRootNode() as ShadowRoot;
      const wrapper = document.createElement('div');
      wrapper.style.lineHeight = '30px';
      shadow.append(wrapper);
      wrapper.append(target);
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(initialHeight);

    await textarea.evaluate((element) => {
      const target = element as HTMLTextAreaElement;
      const shadow = target.getRootNode() as ShadowRoot;
      shadow.append(target);
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(initialHeight);
    await textarea.evaluate((element) => {
      const host = element.getRootNode() as ShadowRoot;
      host.host.remove();
    });
  });

  test('textarea autosize reconnects a wrapper moved from body', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await page.addStyleTag({
      content: `
        .e2e-body-reparent-a textarea { line-height: 20px; }
        .e2e-body-reparent-b textarea { line-height: 30px; }
      `,
    });
    await textarea.evaluate((element) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'e2e-body-reparent-a';
      wrapper.append(element);
      document.body.append(wrapper);
      const newParent = document.createElement('div');
      newParent.className = 'e2e-body-reparent-b';
      newParent.style.width = '300px';
      document.body.append(newParent);
      element.style.minHeight = '0';
      element.value = 'body wrapper '.repeat(20);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const initialHeight = await textarea.evaluate(
      (element) => element.offsetHeight,
    );
    await textarea.evaluate(() => {
      document
        .querySelector('.e2e-body-reparent-b')!
        .append(document.querySelector('.e2e-body-reparent-a')!);
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(initialHeight);

    await textarea.evaluate(() => {
      document.body.append(document.querySelector('.e2e-body-reparent-a')!);
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeLessThanOrEqual(initialHeight);
    await textarea.evaluate((element) => {
      element.parentElement?.remove();
      document.querySelector('.e2e-body-reparent-b')?.remove();
    });
  });

  test('textarea autosize remeasures after a body sibling changes selectors', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await page.addStyleTag({
      content: `
        body > app-root.e2e-body-sibling-selector:last-child #textarea-autosize-input {
          line-height: 32px;
        }
        .e2e-body-sibling-selector #textarea-autosize-input {
          line-height: 20px;
        }
      `,
    });
    await page.locator('app-root').evaluate((element) => {
      element.classList.add('e2e-body-sibling-selector');
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => getComputedStyle(element).lineHeight),
      )
      .toBe('32px');
    const initialHeight = await textarea.evaluate(
      (element) => element.offsetHeight,
    );

    await page.evaluate(() => {
      const sibling = document.createElement('div');
      sibling.className = 'e2e-body-sibling-selector-node';
      document.body.append(sibling);
    });
    await expect
      .poll(() =>
        textarea.evaluate((element) => getComputedStyle(element).lineHeight),
      )
      .toBe('20px');
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .not.toBe(initialHeight);

    await page
      .locator('.e2e-body-sibling-selector-node')
      .evaluate((element) => {
        element.remove();
      });
    await expect
      .poll(() =>
        textarea.evaluate((element) => getComputedStyle(element).lineHeight),
      )
      .toBe('32px');
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(initialHeight);
  });

  test('textarea autosize observes stretched layout items and query containers', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    const style = await page.addStyleTag({
      content: `
        .e2e-flex-shell { display: flex; width: 420px; height: 160px; align-items: stretch; }
        .e2e-grid-shell { display: grid; width: 420px; height: 160px; align-items: stretch; grid-template-rows: 1fr; }
        .e2e-auto-flex-shell { display: flex; width: 420px; align-items: stretch; }
        .e2e-auto-grid-shell { display: grid; width: 420px; align-items: stretch; grid-template-rows: auto; }
        .e2e-layout-item { min-height: 0; }
        .e2e-query-shell { container-type: inline-size; width: 400px; }
        @container (min-width: 500px) {
          .e2e-query-shell textarea { font-size: 24px; line-height: 32px; }
        }
      `,
    });
    const moveInto = async (display: 'flex' | 'grid') =>
      textarea.evaluate((element, nextDisplay) => {
        const shell = document.createElement('div');
        shell.className =
          nextDisplay === 'flex' ? 'e2e-flex-shell' : 'e2e-grid-shell';
        const item = document.createElement('div');
        item.className = 'e2e-layout-item';
        shell.append(item);
        element.parentElement!.append(shell);
        item.append(element);
        element.style.width = '220px';
        element.style.maxHeight = '50%';
        element.style.minHeight = '0';
        element.style.padding = '0';
        element.style.border = '0';
        element.style.lineHeight = '20px';
        element.style.fontSize = '16px';
        element.value = 'layout definite '.repeat(100);
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }, display);

    await moveInto('flex');
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(80);
    await textarea.evaluate((element) => {
      element.parentElement!.parentElement!.style.height = '240px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(120);

    for (const display of ['flex', 'grid'] as const) {
      const stableHeight = await textarea.evaluate((element, nextDisplay) => {
        const shell = document.createElement('div');
        shell.className =
          nextDisplay === 'flex'
            ? 'e2e-auto-flex-shell'
            : 'e2e-auto-grid-shell';
        const item = document.createElement('div');
        item.className = 'e2e-layout-item';
        shell.append(item);
        element.parentElement!.replaceWith(shell);
        item.append(element);
        element.style.maxHeight = '50%';
        element.style.height = '';
        element.value = 'content-sized layout '.repeat(100);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        return element.offsetHeight;
      }, display);
      for (let cycle = 0; cycle < 3; cycle += 1) {
        await textarea.dispatchEvent('input');
        await expect
          .poll(() => textarea.evaluate((element) => element.offsetHeight))
          .toBe(stableHeight);
      }
    }

    await textarea.evaluate((element) => {
      const oldShell = element.parentElement!.parentElement!;
      const gridShell = document.createElement('div');
      gridShell.className = 'e2e-grid-shell';
      const item = document.createElement('div');
      item.className = 'e2e-layout-item';
      gridShell.append(item);
      oldShell.replaceWith(gridShell);
      item.append(element);
      oldShell.remove();
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(80);
    await textarea.evaluate((element) => {
      element.parentElement!.parentElement!.style.height = '240px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(120);

    await textarea.evaluate((element) => {
      const item = element.parentElement!;
      const shell = item.parentElement!;
      shell.style.display = 'block';
      shell.style.height = '';
      element.style.maxHeight = '50%';
    });
    const normalFlowHeight = await textarea.evaluate(
      (element) => element.offsetHeight,
    );
    for (let cycle = 0; cycle < 3; cycle += 1) {
      await textarea.dispatchEvent('input');
      await expect
        .poll(() => textarea.evaluate((element) => element.offsetHeight))
        .toBe(normalFlowHeight);
    }

    await textarea.evaluate((element) => {
      const oldParent = element.parentElement!;
      const queryShell = document.createElement('div');
      queryShell.className = 'e2e-query-shell';
      queryShell.style.width = '400px';
      queryShell.append(element);
      oldParent.replaceWith(queryShell);
      element.style.maxHeight = 'none';
      element.style.height = '';
      element.value = 'query metrics '.repeat(20);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const queryContainerHeight = await textarea.evaluate(
      (element) => element.offsetHeight,
    );
    await textarea.evaluate((element) => {
      element.parentElement!.style.width = '600px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(queryContainerHeight);
    const wideQueryHeight = await textarea.evaluate(
      (element) => element.offsetHeight,
    );
    await textarea.evaluate((element) => {
      element.parentElement!.style.width = '700px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBe(wideQueryHeight);
    await textarea.evaluate((element) => {
      const oldQuery = element.parentElement!;
      const newQuery = document.createElement('div');
      newQuery.className = 'e2e-query-shell';
      newQuery.style.width = '400px';
      newQuery.append(element);
      oldQuery.replaceWith(newQuery);
      oldQuery.style.width = '700px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeLessThan(wideQueryHeight);
    const shadowQueryHeight = await textarea.evaluate((element) => {
      const host = document.createElement('div');
      const shadow = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `
        .shadow-query { container-type: inline-size; width: 400px; }
        @container (min-width: 500px) {
          textarea { line-height: 32px; font-size: 24px; }
        }
      `;
      const shell = document.createElement('div');
      shell.className = 'shadow-query';
      shadow.append(style, shell);
      shell.append(element);
      document.body.append(host);
      element.style.maxHeight = 'none';
      element.style.height = '';
      element.value = 'shadow query metrics '.repeat(20);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return element.offsetHeight;
    });
    await textarea.evaluate((element) => {
      (element.parentElement as HTMLElement).style.width = '600px';
    });
    await expect
      .poll(() => textarea.evaluate((element) => element.offsetHeight))
      .toBeGreaterThan(shadowQueryHeight);
    await style.evaluate((element) => element.remove());
  });

  test('textarea autosize measures one row for a long wrapping normal placeholder', async ({
    page,
  }) => {
    const textarea = page.locator('#textarea-autosize-input');
    await textarea.evaluate((element) => {
      element.style.width = '180px';
      element.style.boxSizing = 'border-box';
      element.style.padding = '4px';
      element.style.border = '1px solid';
      element.style.fontSize = '16px';
      element.style.lineHeight = 'normal';
      element.value = '';
      element.setAttribute('placeholder', 'wrapping placeholder '.repeat(80));
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const longHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    await expect(textarea).toHaveAttribute(
      'placeholder',
      'wrapping placeholder '.repeat(80),
    );
    expect(longHeight).toBeGreaterThan(30);
    expect(longHeight).toBeLessThan(180);

    await textarea.evaluate((element) => {
      element.setAttribute('placeholder', 'short');
    });
    await expect(textarea).toHaveAttribute('placeholder', 'short');
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeLessThan(longHeight);
    const shortHeight = await textarea.evaluate(
      (element) => element.getBoundingClientRect().height,
    );

    await textarea.evaluate((element) => {
      element.removeAttribute('placeholder');
    });
    await expect(textarea).not.toHaveAttribute('placeholder');
    await expect
      .poll(() =>
        textarea.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeLessThanOrEqual(shortHeight);
  });
});
