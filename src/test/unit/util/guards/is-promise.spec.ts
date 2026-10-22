import {isPromise} from '@util/guards/is-promise.ts';
import {describe, expect, test} from 'vitest';

describe('isPromise', () => {
  test('given a promise or a thenable, when checked, then it returns true', () => {
    expect(isPromise(Promise.resolve())).toBe(true);
    expect(isPromise({then: () => {}})).toBe(true);
  });

  test('given null, undefined or primitives, when checked, then it returns false without throwing', () => {
    expect(isPromise(null)).toBe(false);
    expect(isPromise(undefined)).toBe(false);
    expect(isPromise(0)).toBe(false);
    expect(isPromise('then')).toBe(false);
  });

  test('given a plain object without then, when checked, then it returns false', () => {
    expect(isPromise({})).toBe(false);
  });
});
