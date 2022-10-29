import { expect } from 'chai';
import { suite } from 'uvu';
import { getGlobals } from '../../../../operation/helper/globals';
import { setGlobal } from '../../../../operation/helper/set-global';

const SetGlobalSuite = suite('setGlobal');

SetGlobalSuite('should set the global', () => {
  setGlobal('test', 'testing');
  const value = getGlobals('test');
  expect(value).to.equal('testing');
});
