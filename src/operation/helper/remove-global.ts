import { getGlobals } from './globals.ts';

export function removeGlobal(name: string) {
  const cache = getGlobals();
  delete cache[name];
}
