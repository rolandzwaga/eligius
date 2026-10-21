import {isForbiddenPropertyChainSegment} from '@operation/helper/assert-safe-property-chain.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
export type TGlobalCache = Record<string, any>;
// No prototype, so a configured name can never read or replace inherited members.
const cache: TGlobalCache = Object.create(null);

function _getGlobals(
  cache: TGlobalCache,
  name?: string
): Record<string, any> | any {
  if (!name) {
    return cache;
  }
  const value = Object.hasOwn(cache, name) ? cache[name] : undefined;
  return value ? deepCopy(value) : value;
}

function _setGlobals(cache: TGlobalCache, newValues: TGlobalCache): void {
  Object.entries(newValues).forEach(([name, value]) => {
    assertSafeGlobalName(name, 'setGlobals');
    cache[name] = deepCopy(value);
  });
}

function _clearGlobals(cache: TGlobalCache): void {
  const keys = Object.keys(cache);
  keys.forEach(key => delete cache[key]);
}

/**
 * Throws when `name` is `__proto__`, `prototype` or `constructor`. Global names come from
 * configuration and are used as keys of the global store.
 *
 * @param name The global name to check.
 * @param operationName The operation or helper that uses the name, named in the error.
 * @throws When the name is forbidden.
 */
export function assertSafeGlobalName(name: string, operationName: string) {
  if (isForbiddenPropertyChainSegment(name)) {
    throw new Error(
      `${operationName}: global name '${name}' is not allowed. Names may not be __proto__, prototype or constructor.`
    );
  }
}

/**
 * Returns the global data store, or, given a name, a deep copy of the value stored under
 * that name (jQuery objects, DOM nodes, functions and class instances are returned by
 * reference, see `deepCopy`).
 *
 * Only own entries of the store are returned, so `getGlobals('constructor')` is `undefined`.
 */
export const getGlobals: (name?: string) => TGlobalCache | any =
  _getGlobals.bind(null, cache);

/**
 * Stores deep copies of the given values in the global data store, so later in-place
 * changes to the operation data they came from do not change the store.
 *
 * @throws When a name is `__proto__`, `prototype` or `constructor`.
 */
export const setGlobals: (newValues: TGlobalCache) => void = _setGlobals.bind(
  null,
  cache
);

/**
 * Removes every value from the global data store that operations such as
 * `setGlobalData` and `addGlobalsToOperation` share.
 *
 * The store is shared by all engines on the page. `EngineFactory` clears it
 * when the last engine it created is destroyed; call this yourself to reset
 * it earlier, for example between tests.
 */
export const clearGlobals: () => void = _clearGlobals.bind(null, cache);
