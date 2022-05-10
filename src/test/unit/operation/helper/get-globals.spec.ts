import { expect } from 'chai';
import { suite } from 'uvu';
import { getGlobals } from '../../../../operation/helper/get-globals';

const GetGlobalsSuite = suite('getGlobals');

GetGlobalsSuite('should get the globals', () => {
  const cache = getGlobals();
  expect(cache).not.to.be.undefined;
});

GetGlobalsSuite('should get the global by name', () => {
  let cache = getGlobals();
  const value = 'test';
  cache['test'] = value;
  cache = getGlobals('test');
  expect(cache).to.equal(value);
});

GetGlobalsSuite.run();
