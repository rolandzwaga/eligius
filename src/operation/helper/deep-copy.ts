import { isDefined } from 'ts-is-present';

const copyFunction =
  typeof structuredClone !== 'undefined'
    ? structuredClone
    : (original: any) => JSON.parse(JSON.stringify(original));

export function deepCopy<T>(original: T): T {
  if (isDefined(original)) {
    return copyFunction(original) as T;
  }
  return original;
}
