import ConfigurationFactory from '../../../src/configuration/api/configuration-factory';
import { expect } from 'chai';
import { ActionEditor, EndableActionEditor, TimelineActionEditor } from '../../../src/configuration/api/action-editor';

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

    it('addAction should add the specified action', () => {
        // given
        configurationFactory.init('nl-NL');
        const action = {};

        // test
        configurationFactory.addAction(action);

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.actions.length).to.equal(1);
        expect(configuration.actions[0]).to.equal(action);
    });

    it('addInitAction should add the specified initAction', () => {
        // given
        configurationFactory.init('nl-NL');
        const action = {};

        // test
        configurationFactory.addInitAction(action);

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.initActions.length).to.equal(1);
        expect(configuration.initActions[0]).to.equal(action);
    });

    it('addEventAction should add the specified eventAction', () => {
        // given
        configurationFactory.init('nl-NL');
        const action = {};

        // test
        configurationFactory.addEventAction(action);

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.eventActions.length).to.equal(1);
        expect(configuration.eventActions[0]).to.equal(action);
    });

    it('addTimelineAction should throw error when timeline is not found for given uri', () => {
        // given
        configurationFactory.init('nl-NL');
        let errorMessage = null;

        // test
        try{
            configurationFactory.addTimelineAction('test');
        } catch(e) {
            errorMessage = e.message;
        }

        // expect
        expect(errorMessage).to.equal("No timeline found for uri 'test'");
    });

    it('addTimeline should add the specified timeline', () => {
        // given
        configurationFactory.init('nl-NL');

        // test
        configurationFactory.addTimeline('test', 'animation', 100, false, 'selector');

        // expect
        const timeline = configurationFactory.getTimeline('test');
        expect(timeline).not.to.be.null;
        expect(timeline.uri).to.equal('test');
        expect(timeline.type).to.equal('animation');
        expect(timeline.duration).to.equal(100);
        expect(timeline.loop).to.be.false;
        expect(timeline.selector).to.equal('selector');
    });

    it('addTimeline should throw an error when a timeline with the given uri alreayd exists', () => {
        // given
        configurationFactory.init('nl-NL');
        configurationFactory.addTimeline('test', 'animation', 100, false, 'selector');
        let errorMessage =  null;

        // test
        try {
            configurationFactory.addTimeline('test', 'animation', 100, false, 'selector');
        } catch(e) {
            errorMessage = e.message;
        }

        // expect
        expect(errorMessage).to.equal('timeline for uri test already exists');
    });

    it('addTimelineAction should add the specified action', () => {
        // given
        configurationFactory.init('nl-NL');
        configurationFactory.addTimeline('test', 'animation', 100, false, 'selector');
        const action = {};

        // test
        configurationFactory.addTimelineAction('test', action);

        // expect
        const timeline = configurationFactory.getTimeline('test');
        expect(timeline.timelineActions.length).to.equal(1);
        expect(timeline.timelineActions[0]).to.equal(action);
    });

    it('removeTimeline should remove the timeline for the given uri', () => {
        // given
        configurationFactory.init('nl-NL');
        configurationFactory.addTimeline('test', 'animation', 100, false, 'selector');

        // test
        configurationFactory.removeTimeline('test');

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.timelines.length).to.equal(0);
    });

    it('addLabel should add given label info', () => {
        // given
        configurationFactory.init('nl-NL');

        // test
        configurationFactory.addLabel('test', 'nl-NL', 'dit is een test');

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.labels.length).to.equal(1);
        expect(configuration.labels[0].id).to.equal('test');
        expect(configuration.labels[0].labels[0].code).to.equal('nl-NL');
        expect(configuration.labels[0].labels[0].label).to.equal('dit is een test');
    });

    it('addLabel should add given label info to existing label config', () => {
        // given
        configurationFactory.init('nl-NL');

        // test
        configurationFactory.addLabel('test', 'nl-NL', 'dit is een test');
        configurationFactory.addLabel('test', 'en-US', 'this is a test');

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.labels.length).to.equal(1);
        expect(configuration.labels[0].id).to.equal('test');
        expect(configuration.labels[0].labels[1].code).to.equal('en-US');
        expect(configuration.labels[0].labels[1].label).to.equal('this is a test');
    });

    it('createAction should add an action with the given name', () => {
        // given
        configurationFactory.init('nl-NL');

        // test
        const creator = configurationFactory.createAction('TestAction');

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.actions.length).to.equal(1);
        expect(configuration.actions[0].name).to.equal('TestAction');
        expect(creator).not.to.be.null;
    });

    it('createInitAction should add an init action with the given name', () => {
        // given
        configurationFactory.init('nl-NL');

        // test
        const creator = configurationFactory.createInitAction('TestInitAction');

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.initActions.length).to.equal(1);
        expect(configuration.initActions[0].name).to.equal('TestInitAction');
        expect(creator).not.to.be.null;
    });

    it('createEventAction should add an event action with the given name', () => {
        // given
        configurationFactory.init('nl-NL');

        // test
        const creator = configurationFactory.createEventAction('TestEventAction');

        // expect
        const { configuration } = configurationFactory;
        expect(configuration.eventActions.length).to.equal(1);
        expect(configuration.eventActions[0].name).to.equal('TestEventAction');
        expect(creator).not.to.be.null;
    });

    it('createTimelineAction should add a timeline action with the given name to the timeline with the given uri', () => {
        // given
        configurationFactory.init('nl-NL');
        configurationFactory.addTimeline('test', 'animation', 100, false, 'selector');

        // test
        const creator = configurationFactory.createTimelineAction('test', 'TestTimelineAction');

        // expect
        const timeline = configurationFactory.getTimeline('test');

        expect(timeline.timelineActions.length).to.equal(1);
        expect(timeline.timelineActions[0].name).to.equal('TestTimelineAction');
        expect(creator).not.to.be.null;
    });

    it('editAction should return an actioneditor instance', () => {
        // given
        configurationFactory.init('nl-NL');
        const creator = configurationFactory.createAction('TestAction');
        const { actionConfig } = creator;
        
        // test
        const editor = configurationFactory.editAction(actionConfig.id);

        // expect
        expect(editor).to.be.an.instanceOf(ActionEditor);
    });

    it('editEventAction should return an actioneditor instance', () => {
        // given
        configurationFactory.init('nl-NL');
        const creator = configurationFactory.createEventAction('TestEventAction');
        const { actionConfig } = creator;
        
        // test
        const editor = configurationFactory.editEventAction(actionConfig.id);

        // expect
        expect(editor).to.be.an.instanceOf(ActionEditor);
    });

    it('editInitAction should return an endableactioneditor instance', () => {
        // given
        configurationFactory.init('nl-NL');
        const creator = configurationFactory.createInitAction('TestInitAction');
        const { actionConfig } = creator;
        
        // test
        const editor = configurationFactory.editInitAction(actionConfig.id);

        // expect
        expect(editor).to.be.an.instanceOf(EndableActionEditor);
    });

    it('editTimelineAction should return a timelineactioneditor instance', () => {
        // given
        configurationFactory.init('nl-NL');
        configurationFactory.addTimeline('test', 'animation', 100, false, 'selector');

        const creator = configurationFactory.createTimelineAction('test', 'TestTimelineAction');
        const { actionConfig } = creator;

        console.dir(actionConfig);
        
        // test
        const editor = configurationFactory.editTimelineAction('test', actionConfig.id);

        // expect
        expect(editor).to.be.an.instanceOf(TimelineActionEditor);
    });

});
