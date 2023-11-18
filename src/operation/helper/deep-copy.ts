import { isDefined } from 'ts-is-present';

const copyFunction =
  typeof structuredClone !== 'undefined'
    ? structuredClone
    : <T>(original: any) => JSON.parse(JSON.stringify(original)) as T;

export function deepCopy<T>(original: T): T {
  if (isDefined(original)) {
    return copyFunction<T>(original);
  }
  return original;
}
