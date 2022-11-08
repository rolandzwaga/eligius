import { deepCopy } from './deep-copy';
export type TGlobalCache = Record<string, any>;
const cache: TGlobalCache = {};

function _getGlobals(
  cache: TGlobalCache,
  name?: string
): Record<string, any> | any {
  const value = name ? cache[name] : cache;
  return value && value !== cache ? deepCopy(value) : value;
}

function _setGlobals(cache: TGlobalCache, newValues: TGlobalCache): void {
  Object.entries(newValues).forEach(([name, value]) => (cache[name] = value));
}

function _clearGlobals(cache: TGlobalCache): void {
  const keys = Object.keys(cache);
  keys.forEach((key) => delete cache[key]);
}

export const getGlobals: (name?: string) => TGlobalCache | any =
  _getGlobals.bind(null, cache);

export const setGlobals: (newValues: TGlobalCache) => void = _setGlobals.bind(
  null,
  cache
);

export const clearGlobals: () => void = _clearGlobals.bind(null, cache);
