// Synthetic mouse events cannot activate :hover/:active, and programmatic focus
// depends on the browser's previous input modality for :focus-visible. Match
// authored state rules with an attribute without changing their declarations;
// these helpers verify style precedence rather than browser interaction patterns.
export function activateStateStyle(
  target: HTMLElement,
  state: 'hover' | 'active' | 'focus-visible',
): () => void {
  const attribute = `data-theme-test-${state}`;
  const changed: { rule: CSSStyleRule; selector: string }[] = [];
  target.setAttribute(attribute, '');
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (
        !(rule instanceof CSSStyleRule) ||
        !rule.selectorText.includes(`:${state}`)
      )
        continue;
      const selector = rule.selectorText.replaceAll(
        `:${state}`,
        `[${attribute}]`,
      );
      if (target.matches(selector)) {
        changed.push({ rule, selector: rule.selectorText });
        rule.selectorText = selector;
      }
    }
  }
  expect(changed.length)
    .withContext(`Expected an authored :${state} rule`)
    .toBeGreaterThan(0);
  return () => {
    changed.forEach(({ rule, selector }) => {
      rule.selectorText = selector;
    });
    target.removeAttribute(attribute);
  };
}
