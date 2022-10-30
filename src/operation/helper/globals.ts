import { deepCopy } from './deep-copy';
const cache: Record<string, any> = {};

function _getGlobals(
  cache: Record<string, any>,
  name?: string
): Record<string, any> | any {
  const value = name ? cache[name] : cache;
  return value && value !== cache ? deepCopy(value) : value;
}

function _setGlobals(
  cache: Record<string, any>,
  newValues: Record<string, any>
): void {
  Object.entries(newValues).forEach(([name, value]) => (cache[name] = value));
}

function _clearGlobals(cache: Record<string, any>): void {
  const keys = Object.keys(cache);
  keys.forEach((key) => delete cache[key]);
}

export const getGlobals: (name?: string) => Record<string, any> | any =
  _getGlobals.bind(null, cache);

export const setGlobals: (newValues: Record<string, any>) => void =
  _setGlobals.bind(null, cache);

export const clearGlobals: () => void = _clearGlobals.bind(null, cache);
