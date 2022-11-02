import { getGlobals } from './globals';

export function removeGlobal(name: string) {
  const cache = getGlobals();
  delete cache[name];
}
