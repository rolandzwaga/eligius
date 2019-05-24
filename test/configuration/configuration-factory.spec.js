import ConfigurationFactory from '../../src/configuration/api/configuration-factory';

describe('ConfigurationFactory', () => {

    let configurationFactory;

    beforeEach(() => {
        configurationFactory = new ConfigurationFactory();
    });

    it('should initialize a config', () => {
        // test
        configurationFactory.init('nl-NL');

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.id).not.to.be.null();
    })
});
