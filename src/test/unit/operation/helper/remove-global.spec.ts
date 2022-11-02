import { expect } from 'chai';
import { suite } from 'uvu';
import { getGlobals } from '../../../../operation/helper/globals';
import { removeGlobal } from '../../../../operation/helper/remove-global';
import { setGlobal } from '../../../../operation/helper/set-global';

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
