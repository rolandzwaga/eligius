import { expect } from 'chai';
import { suite } from 'uvu';
import { getGlobals, setGlobals } from '../../../../operation/helper/globals.ts';

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

const SetGlobalsSuite = suite('setGlobals');

SetGlobalsSuite('should set the given globals', () => {
  setGlobals({ foo: 'bar', bar: 'foo' });

  const cache = getGlobals();

  expect(cache['foo']).to.equal('bar');
  expect(cache['bar']).to.equal('foo');
});

GetGlobalsSuite.run();
