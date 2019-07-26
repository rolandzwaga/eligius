import getGlobals from './getGlobals';

export function setGlobal(name, value) {
    const cache = getGlobals();
    cache[name] = value;
}

export default setGlobal;
