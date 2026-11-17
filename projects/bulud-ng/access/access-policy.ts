import {InjectionToken,Signal} from '@angular/core';
export type BuludAccessRule =
  | string
  | readonly string[]
  | {
      readonly any?: readonly string[];
      readonly all?: readonly string[];
      readonly not?: readonly string[];
    };
export interface BuludAccessConfig {
  readonly scopes?: () => readonly string[];
  readonly enforce?: () => boolean;
  readonly revision?: Signal<unknown>;
  readonly caseSensitiveScopes?: boolean;
}
export const BULUD_ACCESS_CONFIG = new InjectionToken<BuludAccessConfig>(
  'BULUD_ACCESS_CONFIG',
  { providedIn: 'root', factory: () => ({}) },
);
export function buludMatchesAccess(
  rule: BuludAccessRule,
  scopes: readonly string[],
  caseSensitiveScopes = false,
): boolean {
  if (rule === '*') return true;
  const match = (permission: string) => {
    const [resource, action] = permission.toLowerCase().split(':');
    if (!resource || !action) return false;
    return scopes.some((scope) => {
      const [original, actions] = scope.split(':');
      const name = caseSensitiveScopes ? original : original.toLowerCase();
      return (
        (name === resource || name === '*') &&
        (actions === '*' || !!actions?.includes(action.toUpperCase()))
      );
    });
  };
  if (typeof rule === 'string') return match(rule);
  if (Array.isArray(rule)) return rule.some(match);
  const options = rule as Exclude<BuludAccessRule, string | readonly string[]>;
  return (
    (!options.any || options.any.some(match)) &&
    (!options.all || options.all.every(match)) &&
    (!options.not || options.not.every((p) => !match(p)))
  );
}
