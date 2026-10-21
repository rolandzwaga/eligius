import {isPlainObject} from '@util/guards/is-plain-object.ts';
import {describe, expect, test} from 'vitest';

class Thing {}

describe('isPlainObject', () => {
  test.each([
    ['an object literal', {a: 1}],
    ['an empty object literal', {}],
    ['parsed JSON', JSON.parse('{"a": {"b": 2}}')],
    ['a null-prototype object', Object.create(null)],
  ])(
    'given %s, when isPlainObject is called, then it returns true',
    (_, value) => {
      expect(isPlainObject(value)).toBe(true);
    }
  );

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['an array', [1, 2]],
    ['a string', 'text'],
    ['a number', 42],
    ['a function', () => {}],
    ['a class instance', new Thing()],
    ['a Date', new Date()],
    ['a Map', new Map()],
    ['a DOM element', document.createElement('div')],
    ['an object inheriting from an object literal', Object.create({a: 1})],
  ])(
    'given %s, when isPlainObject is called, then it returns false',
    (_, value) => {
      expect(isPlainObject(value)).toBe(false);
    }
  );

  test('given a jQuery object, when isPlainObject is called, then it returns false', async () => {
    const {default: $} = await import('jquery');

    expect(isPlainObject($('<div>'))).toBe(false);
  });
});
