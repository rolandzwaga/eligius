import {isString} from '@util/guards/is-string.ts';
import {describe, expect, test} from 'vitest';

describe('isString', () => {
  test.each([
    ['a string literal', 'text'],
    ['an empty string', ''],
    ['a template literal', `${1 + 1}px`],
  ])('given %s, when isString is called, then it returns true', (_, value) => {
    expect(isString(value)).toBe(true);
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['a String wrapper object', new String('text')],
    ['an array of characters', ['t', 'e']],
    ['an object with toString', {toString: () => 'text'}],
  ])('given %s, when isString is called, then it returns false', (_, value) => {
    expect(isString(value)).toBe(false);
  });
});
