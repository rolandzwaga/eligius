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


describe('ConfigurationResolver', () => {

    let importer =  null;

    beforeEach(() => {
        importer = new MockImporter();
    });

    it('should create', () => {
        // given
        // test
        const resolver = new ConfigurationResolver(importer);

        // expect
        expect(resolver.importer).to.equal(importer);
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