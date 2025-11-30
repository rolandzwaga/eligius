import {getGlobals} from '@operation/helper/globals.ts';
import {removeGlobal} from '@operation/helper/remove-global.ts';
import {setGlobal} from '@operation/helper/set-global.ts';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';

describe('setGlobal', () => {
  beforeAll(() => {
    setGlobal('foo', 'bar');
  });
  afterAll(() => {
    removeGlobal('foo');
  });
  test('should set the global', () => {
    const value = getGlobals('foo');
    expect(value).toBe('bar');
  });
});
