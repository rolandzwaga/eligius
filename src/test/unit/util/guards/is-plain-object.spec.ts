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

  test('given an object literal and parsed JSON from another realm, when isPlainObject is called, then it returns true', async () => {
    const vm = await import('node:vm');
    const literal = vm.runInNewContext('({a: 1})');
    const parsed = vm.runInNewContext('JSON.parse(\'{"b": 2}\')');

    expect(Object.getPrototypeOf(literal)).not.toBe(Object.prototype);
    expect(isPlainObject(literal)).toBe(true);
    expect(isPlainObject(parsed)).toBe(true);
  });

  test('given an array, a Date and a class instance from another realm, when isPlainObject is called, then it returns false', async () => {
    const vm = await import('node:vm');
    const [array, date, instance] = vm.runInNewContext(
      '[[1], new Date(), new (class Thing {})()]'
    );

    expect(isPlainObject(array)).toBe(false);
    expect(isPlainObject(date)).toBe(false);
    expect(isPlainObject(instance)).toBe(false);
  });

  test('given an object inheriting from a null-prototype object, when isPlainObject is called, then it returns false', () => {
    expect(isPlainObject(Object.create(Object.create(null)))).toBe(false);
  });

  test('given the isPlainObject exported by deep-copy, when compared to the guard, then it is the same function', async () => {
    const deepCopyModule = await import('@operation/helper/deep-copy.ts');

    expect(deepCopyModule.isPlainObject).toBe(isPlainObject);
  });

  test('given a jQuery object, when isPlainObject is called, then it returns false', async () => {
    const {default: $} = await import('jquery');

    expect(isPlainObject($('<div>'))).toBe(false);
  });
});
