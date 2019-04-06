import { expect } from 'chai';
import sinon from 'sinon';

describe('ChronoTriggerEngine', () => {

    let ChronoTriggerEngine = null;
    let fakeContainer = null;
    let configuration = {};
    let eventbus = {};
    let provider = {};

    beforeEach(() => {
        const inject = require('inject-loader!../src/chrono-trigger-engine');

        ChronoTriggerEngine = inject({
            'jquery': jQueryStub
          }).default;
    });

    function jQueryStub(input) {
        return fakeContainer;
    }
    
    it('should create an engine', () => {
      const engine = new ChronoTriggerEngine(configuration, eventbus, provider);

      expect(engine).to.not.equal(null);
      expect(engine.configuration).to.equal(configuration);
      expect(engine.eventbus).to.equal(eventbus);
      expect(engine.timelineProvider).to.equal(provider);
    });

    it('should create the layout template', () => {
      configuration.layoutTemplate = '<div/>';
      configuration.containerSelector = '.test';
      
      fakeContainer = {
        html: sinon.stub().withArgs(configuration.layoutTemplate),
        length: 1
      };

      const engine = new ChronoTriggerEngine(configuration, eventbus, provider);
      engine.createLayoutTemplate();
    });
     
});