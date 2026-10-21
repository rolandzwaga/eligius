import {isObject} from '@util/guards/is-object.ts';
import {describe, expect, test} from 'vitest';

class Thing {}

describe('isObject', () => {
  test.each([
    ['an object literal', {a: 1}],
    ['a null-prototype object', Object.create(null)],
    ['a class instance', new Thing()],
    ['a Date', new Date()],
    ['a Map', new Map()],
    ['a DOM element', document.createElement('div')],
  ])('given %s, when isObject is called, then it returns true', (_, value) => {
    expect(isObject(value)).toBe(true);
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['an array', [1, 2]],
    ['a string', 'text'],
    ['a number', 42],
    ['a function', () => {}],
  ])('given %s, when isObject is called, then it returns false', (_, value) => {
    expect(isObject(value)).toBe(false);
  });
});
