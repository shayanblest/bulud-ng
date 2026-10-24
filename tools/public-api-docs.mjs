/** Collect public identifiers without treating input names or prose as exports. */
export function documentedIdentifiers(text, exportNames = new Set()) {
  const identifiers = text.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) ?? [];
  return new Set(
    identifiers.filter(
      (name) =>
        exportNames.has(name) ||
        /^(?:Bulud[A-Za-z0-9_$]*|[A-Za-z_$][A-Za-z0-9_$]*Bulud[A-Za-z0-9_$]*|BULUD[A-Za-z0-9_$]*)$/.test(
          name,
        ),
    ),
  );
}
