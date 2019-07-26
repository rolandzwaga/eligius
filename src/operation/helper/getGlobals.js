import deepcopy from './deepcopy';
const cache = {};

function getGlobals(cache, name) {
    const value = (name) ? cache[name] : cache;
    return value && value !== cache ? deepcopy(value) : value;
}

export default getGlobals.bind(null, cache);
