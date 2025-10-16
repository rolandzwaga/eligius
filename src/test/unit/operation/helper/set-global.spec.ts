import {expect} from 'chai';
import {afterAll, beforeAll, describe, test} from 'vitest';
import {getGlobals} from '../../../../operation/helper/globals.ts';
import {removeGlobal} from '../../../../operation/helper/remove-global.ts';
import {setGlobal} from '../../../../operation/helper/set-global.ts';

describe('setGlobal', () => {
  beforeAll(() => {
    setGlobal('foo', 'bar');
  });
  afterAll(() => {
    removeGlobal('foo');
  });
  test('should set the global', () => {
    const value = getGlobals('foo');
    expect(value).to.equal('bar');
  });
});
