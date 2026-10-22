import {isFunction} from '@util/guards/is-function.ts';
import {describe, expect, test} from 'vitest';

class Thing {}

describe('isFunction', () => {
  test.each([
    ['an arrow function', () => {}],
    ['a function expression', function named() {}],
    ['an async function', async () => {}],
    ['a generator function', function* gen() {}],
    ['a class', Thing],
    ['a bound function', (() => {}).bind(null)],
  ])(
    'given %s, when isFunction is called, then it returns true',
    (_, value) => {
      expect(isFunction(value)).toBe(true);
    }
  );

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['a string naming a function', 'selectElement'],
    ['an object with a call property', {call: () => {}}],
    ['a class instance', new Thing()],
  ])(
    'given %s, when isFunction is called, then it returns false',
    (_, value) => {
      expect(isFunction(value)).toBe(false);
    }
  );
});
