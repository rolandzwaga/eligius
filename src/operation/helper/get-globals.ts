import deepcopy from './deepcopy';
const cache: Record<string, any> = {};

function _getGlobals(cache: any, name?: string): Record<string, any> | any {
  const value = name ? cache[name] : cache;
  return value && value !== cache ? deepcopy(value) : value;
}

const getGlobals: (name?: string) => any = _getGlobals.bind(null, cache);

export default getGlobals;
