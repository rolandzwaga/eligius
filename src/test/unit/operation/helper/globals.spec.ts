import {
  clearGlobals,
  getGlobals,
  setGlobals,
} from '@operation/helper/globals.ts';
import $ from 'jquery';
import {describe, expect, test} from 'vitest';

describe('globals', () => {
  test('should get the globals', () => {
    const cache = getGlobals();
    expect(cache).not.toBeUndefined();
  });
  test('should get the global by name', () => {
    let cache = getGlobals();
    const value = 'test';
    cache['test'] = value;
    cache = getGlobals('test');
    expect(cache).toBe(value);
  });
  test('should set the given globals', () => {
    setGlobals({foo: 'bar', bar: 'foo'});

    const cache = getGlobals();

    expect(cache['foo']).toBe('bar');
    expect(cache['bar']).toBe('foo');
  });

  test('given a stored non-empty jQuery selectedElement, when getGlobals is called with its name, then the same jQuery instance is returned without throwing', () => {
    const selectedElement = $(document.createElement('div'));
    setGlobals({selectedElement});

    expect(getGlobals('selectedElement')).toBe(selectedElement);
  });

  test('given a stored function, when getGlobals is called with its name, then the same function is returned', () => {
    const fn = () => 1;
    setGlobals({fn});

    expect(getGlobals('fn')).toBe(fn);
  });

  test('given stored plain data, when getGlobals is called with its name, then a copy is returned', () => {
    const data = {a: {b: 1}};
    setGlobals({data});

    const result = getGlobals('data');

    expect(result).toEqual(data);
    expect(result).not.toBe(data);
  });

  test('given stored globals, when clearGlobals is called, then the store is empty', () => {
    setGlobals({toClear: 1});

    clearGlobals();

    expect(getGlobals()).toEqual({});
  });
});
