import {getGlobals} from './globals.ts';

export function setGlobal(name: string, value: any) {
  const cache = getGlobals();
  cache[name] = value;
}
