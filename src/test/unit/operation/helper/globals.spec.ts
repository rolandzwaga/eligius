import {expect} from 'chai';
import {describe, test} from 'vitest';
import {getGlobals, setGlobals} from '../../../../operation/helper/globals.ts';

describe.concurrent('globals', () => {
  test('should get the globals', () => {
    const cache = getGlobals();
    expect(cache).not.to.be.undefined;
  });
  test('should get the global by name', () => {
    let cache = getGlobals();
    const value = 'test';
    cache['test'] = value;
    cache = getGlobals('test');
    expect(cache).to.equal(value);
  });
  test('should set the given globals', () => {
    setGlobals({foo: 'bar', bar: 'foo'});

    const cache = getGlobals();

    expect(cache['foo']).to.equal('bar');
    expect(cache['bar']).to.equal('foo');
  });
});
