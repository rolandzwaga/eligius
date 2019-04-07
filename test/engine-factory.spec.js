import { expect } from 'chai';

class MockImporter {
    import(name) {
        return { [name]: {} };
    }
}

describe('EngineFactory', () => {

    let EngineFactory;
    let windowRef = {};
    let resizer;

    beforeEach(() => {
        EngineFactory = null;

        const inject = require('inject-loader!../src/engine-factory');

        EngineFactory = inject({
            'jquery': jQueryStub
        }).default;
    });

    function jQueryStub(windowInst) {
        expect(windowInst).to.equal(windowRef);
        return resizer;
    }

    it('should create', () => {
        // given
        const importer = new MockImporter();
        resizer = {
            resize: (handler) => {
                expect(handler).to.not.equal(null);
            }
        }

        // test
        const factory = new EngineFactory(importer, windowRef);
    });
});