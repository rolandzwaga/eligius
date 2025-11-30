import {getGlobals} from '@operation/helper/globals.ts';

export function setGlobal(name: string, value: any) {
  const cache = getGlobals();
  cache[name] = value;
}
