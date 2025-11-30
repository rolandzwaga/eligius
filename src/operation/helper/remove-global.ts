import {getGlobals} from '@operation/helper/globals.ts';

export function removeGlobal(name: string) {
  const cache = getGlobals();
  delete cache[name];
}
