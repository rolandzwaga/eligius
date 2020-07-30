import getGlobals from './getGlobals';

export function setGlobal(name: string, value: any) {
  const cache = getGlobals();
  cache[name] = value;
}

export default setGlobal;
