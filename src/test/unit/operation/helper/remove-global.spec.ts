import { expect } from 'chai';
import { suite } from 'uvu';
import { getGlobals } from '../../../../operation/helper/globals.ts';
import { removeGlobal } from '../../../../operation/helper/remove-global.ts';
import { setGlobal } from '../../../../operation/helper/set-global.ts';

const RemoveGlobalSuite = suite('removeGlobal');

RemoveGlobalSuite.before(() => {
  setGlobal('foo', 'bar');
});

RemoveGlobalSuite.after(() => {
  removeGlobal('foo');
});

RemoveGlobalSuite('should set the global', () => {
  removeGlobal('foo');
  const value = getGlobals('foo');
  expect(value).to.be.undefined;
});
