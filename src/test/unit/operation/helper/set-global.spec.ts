import { expect } from 'chai';
import { suite } from 'uvu';
import { getGlobals } from '../../../../operation/helper/globals.ts';
import { removeGlobal } from '../../../../operation/helper/remove-global.ts';
import { setGlobal } from '../../../../operation/helper/set-global.ts';

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
