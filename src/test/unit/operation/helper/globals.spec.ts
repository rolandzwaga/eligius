import {getGlobals, setGlobals} from '@operation/helper/globals.ts';
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
});
