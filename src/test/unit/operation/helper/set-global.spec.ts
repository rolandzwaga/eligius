import { expect } from 'chai';
import { suite } from 'uvu';
import { getGlobals } from '../../../../operation/helper/globals';
import { removeGlobal } from '../../../../operation/helper/remove-global';
import { setGlobal } from '../../../../operation/helper/set-global';

const SetGlobalSuite = suite('setGlobal');

SetGlobalSuite.before(() => {
  setGlobal('foo', 'bar');
});

SetGlobalSuite.after(() => {
  removeGlobal('foo');
});

SetGlobalSuite('should set the global', () => {
  const value = getGlobals('foo');
  expect(value).to.equal('bar');
});
