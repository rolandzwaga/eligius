import { expect } from 'chai';
import getGlobals from '../../../src/operation/helper/getGlobals';

describe('getGlobals', () => {
    it('should get the globals', () => {
        const cache = getGlobals();
        expect(cache).not.to.be.undefined;
    });

    it('should get the global by name', () => {
        let cache = getGlobals();
        const value = 'test';
        cache['test'] = value;
        cache = getGlobals('test');
        expect(cache).to.equal(value);
    });

});
