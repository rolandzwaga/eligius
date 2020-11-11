import { expect } from 'chai';
import getGlobals from '../../../operation/helper/getGlobals';
import setGlobal from '../../../operation/helper/setGlobal';

describe('getGlobals', () => {
  it('should set the global', () => {
    setGlobal('test', 'testing');
    const value = getGlobals('test');
    expect(value).to.equal('testing');
  });
});
