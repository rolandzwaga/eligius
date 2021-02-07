import { isDefined } from 'ts-is-present';

export function deepCopy<T>(original: T): T {
  if (isDefined(original)) {
    return JSON.parse(JSON.stringify(original)) as T;
  }
  return original;
}
