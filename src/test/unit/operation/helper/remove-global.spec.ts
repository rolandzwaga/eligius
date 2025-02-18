import { expect } from 'chai';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { getGlobals } from '../../../../operation/helper/globals.ts';
import { removeGlobal } from '../../../../operation/helper/remove-global.ts';
import { setGlobal } from '../../../../operation/helper/set-global.ts';
describe('removeGlobal', () => {
  beforeAll(() => {
    setGlobal('foo', 'bar');
  });
  afterAll(() => {
    removeGlobal('foo');
  });
  test('should set the global', () => {
    removeGlobal('foo');
    const value = getGlobals('foo');
    expect(value).to.be.undefined;
  });
});
