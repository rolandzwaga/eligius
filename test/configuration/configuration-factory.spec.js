import ConfigurationFactory from '../../src/configuration/api/configuration-factory';
import { expect } from 'chai';
import attachControllerToElement from '../../src/operation/helper/attachControllerToElement';

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
        expect(configuration.id).not.to.be.undefined;
        expect(configuration.engine.systemName).to.equal('ChronoTriggerEngine');
        expect(configuration.containerSelector).to.equal('#ct-container');
        expect(configuration.timelineProviderSettings).to.deep.equal({vendor: null, selector: null, systemName: null});
        expect(configuration.language).to.equal('nl-NL');
        expect(configuration.availableLanguages.length).to.equal(0);
    });

    it('should add the given timelinesettings', () => {
        // given
        configurationFactory.init('nl-NL');

        // test
        configurationFactory.addTimelineSettings('selector', 'RequestAnimationFrameTimelineProvider');

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.timelineProviderSettings.selector).to.equal('selector');
        expect(configuration.timelineProviderSettings.systemName).to.equal('RequestAnimationFrameTimelineProvider');
    });

    it('should throw an error when timelineprovider systemname does not exist', () => {
        // given
        configurationFactory.init('nl-NL');
        let error = null;
        // test
        try {
            configurationFactory.addTimelineSettings('selector', 'Unknown');
        } catch(e) {
            error = e;
        }

        // expect
        expect(error).not.to.be.null;
        expect(error.message).to.equal('Unknown timelineprovider system name: Unknown');
    });

    it('should add the given language', () => {
        // given
        configurationFactory.init('nl-NL');

        // test
        configurationFactory.addLanguage('en-US', 'English');

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.availableLanguages.length).to.equal(1);
        const lang = configuration.availableLanguages[0];
        expect(lang.code).to.equal('en-US');
        expect(lang.label).to.equal('English');
    });

});
