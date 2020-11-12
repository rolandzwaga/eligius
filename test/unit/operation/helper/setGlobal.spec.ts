import { expect } from 'chai';
import { getGlobals } from '~/operation/helper/get-globals';
import { setGlobal } from '~/operation/helper/set-global';

describe('getGlobals', () => {
  it('should set the global', () => {
    setGlobal('test', 'testing');
    const value = getGlobals('test');
    expect(value).to.equal('testing');
  });
});
