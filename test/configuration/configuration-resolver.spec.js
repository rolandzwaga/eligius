import ConfigurationResolver from "../../src/configuration/configuration-resolver";
import { expect } from 'chai';

class MockImporter {

    constructor() {
        this.lookup = {};
    }

    import(name) {
        return { [name]: this.lookup[name] } || { [name]: {} };
    }

    addEntry(name, value) {
        this.lookup[name] = value;
    }
}

class MockEventbus {
    constructor(){
    }
}

class MockActionRegistryListener {
    registerAction(eventAction, eventName, eventTopic) {}
}

describe.only('ConfigurationResolver', () => {

    let importer =  null;
    let eventbus = null;

    beforeEach(() => {
        importer = new MockImporter();
        eventbus = new MockEventbus();
    });

    it('should create', () => {
        // given
        // test
        const resolver = new ConfigurationResolver(importer, eventbus);

        // expect
        expect(resolver.importer).to.equal(importer);
        expect(resolver.eventbus).to.equal(eventbus);
    });

    it('should initialize initActions', ()=> {
        // give
        const config = {
            initActions:[
                {
                    name: "TestAction",
                    startOperations: [
                        {
                            systemName: "selectElement",
                            operationData: {
                                selector: "#progress"
                            }
                        }
                    ]
                }
            ]
        };
        const resolver = new ConfigurationResolver(importer, eventbus);
        const actionsLookup = {};

        // test
        resolver.initializeInitActions(config, actionsLookup);

        // expect
        const resolvedAction = config.initActions[0];
        expect(actionsLookup["TestAction"]).to.not.null;
        expect(resolvedAction.eventbus).to.equal(resolver.eventbus);
    });

    it('should initialize actions', () => {
        // give
        const config = {
            actions:[
                {
                    name: "TestAction",
                    startOperations: [
                        {
                            systemName: "selectElement",
                            operationData: {
                                selector: "#progress"
                            }
                        }
                    ]
                }
            ]
        };
        const resolver = new ConfigurationResolver(importer, eventbus);
        const actionsLookup = {};

        // test
        resolver.initializeActions(config, actionsLookup);

        // expect
        const resolvedAction = actionsLookup["TestAction"];
        expect(resolvedAction).to.not.null;
        expect(resolvedAction.eventbus).to.equal(resolver.eventbus);
    });

    it('should initialize timeline actions', () => {
        // give
        const config = {
            timelines: [
                {
                    timelineActions:[
                        {
                            name: "TestAction",
                            duration: {
                                start: 10,
                                end: 15
                            },
                            startOperations: [
                                {
                                    systemName: "selectElement",
                                    operationData: {
                                        selector: "#progress"
                                    }
                                }
                            ]
                        }
                    ]
        
                }
            ]
        };
        const resolver = new ConfigurationResolver(importer, eventbus);

        // test
        resolver.initializeTimelineActions(config);

        // expect
        const resolvedAction = config.timelines[0].timelineActions[0];
        expect(resolvedAction).to.not.null;
        expect(resolvedAction.eventbus).to.equal(resolver.eventbus);
    });

    it('should resolve config: properties', () => {
        // give
        const config = {
            complexProperty: {
                value: 'test'
            },
            resolvedProperty: 'config:complexProperty.value'
        };
        const resolver = new ConfigurationResolver(importer);

        // test
        resolver.processConfiguration(config, config);

        // expect
        expect(config.resolvedProperty).to.equal(config.complexProperty.value);
    });

    it('should resolve json: properties', () => {
        // give
        const config = {
            resolvedProperty: 'json:test'
        };
        const resolver = new ConfigurationResolver(importer);
        importer.addEntry('test', { test: "testValue" });

        // test
        resolver.processConfiguration(config, config);

        // expect
        expect(config.resolvedProperty.test).to.equal('testValue');
    });

    it('should resolve template: properties', () => {
        // give
        const config = {
            resolvedProperty: 'template:test'
        };
        const resolver = new ConfigurationResolver(importer);
        importer.addEntry('test', '<div>This is my template</div>');

        // test
        resolver.processConfiguration(config, config);

        // expect
        expect(config.resolvedProperty).to.equal('<div>This is my template</div>');
    });

});