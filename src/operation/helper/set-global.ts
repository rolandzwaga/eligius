import {assertSafeGlobalName, getGlobals} from '@operation/helper/globals.ts';

/**
 * Stores `value` under `name` in the global data store, by reference.
 *
 * @throws When the name is `__proto__`, `prototype` or `constructor`.
 */
export function setGlobal(name: string, value: any) {
  assertSafeGlobalName(name, 'setGlobal');
  const cache = getGlobals();
  cache[name] = value;
}
