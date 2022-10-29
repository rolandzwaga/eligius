import { getGlobals } from './globals';

export function setGlobal(name: string, value: any) {
  const cache = getGlobals();
  cache[name] = value;
}
