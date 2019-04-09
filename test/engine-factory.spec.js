import { expect } from 'chai';

class MockImporter {
    import(name) {
        if (name === 'ChronoTriggerEngine') {
            return { 'ChronoTriggerEngine': MockEngine };
        } else if (name === 'MockTimelineProvider') {
            return { 'MockTimelineProvider': MockTimelineProvider };
        }
        return { [name]: {} };
    }
}

class MockEngine {
    constructor(config, eventbus, provider) {
        this.config  = config;
        this.eventbus = eventbus;
        this.provider = provider;
    }
}

class MockEventbus {
    registerInterceptor(name, instance) {
        return {};
    }
}

class MockTimelineProvider {

}

class ConfigurationResolverStub {
    process(actionRegistryListener, configuration) {

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
            'jquery': jQueryStub,
            './configuration/configuration-resolver': ConfigurationResolverStub
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

    it('should create the engine', () => {
        // given
        const importer = new MockImporter();
        const factory = new EngineFactory(importer, windowRef);

        const config = {
            engine: {
                systemName: 'ChronoTriggerEngine'
            },
            timelineProviderSettings: {
                systemName: 'MockTimelineProvider'
            }
        };

        // test
        factory.createEngine(config);
    });
});