/** Keep invariant geometry at the preset scope; only colors/state vary by mode. */
export function partitionThemeVariables(light, dark) {
  if (
    Object.keys(light).length !== Object.keys(dark).length ||
    Object.keys(light).some((key) => !Object.hasOwn(dark, key))
  )
    throw new Error(
      "Theme modes must declare the same variables for nested scope restoration.",
    );
  const common = {},
    lightMode = {},
    darkMode = {};
  for (const [key, value] of Object.entries(light)) {
    if (value === dark[key]) common[key] = value;
    else {
      lightMode[key] = value;
      darkMode[key] = dark[key];
    }
  }
  return { common, light: lightMode, dark: darkMode };
}
