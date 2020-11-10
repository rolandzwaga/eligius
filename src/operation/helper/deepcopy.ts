import { isDefined } from 'ts-is-present';

export function deepcopy<T>(original: T): T {
  if (isDefined(original)) {
    return JSON.parse(JSON.stringify(original)) as T;
  }
  return original;
}
