import { expect } from 'chai';
import sinon from 'sinon';

describe('ChronoTriggerEngine', () => {

    let ChronoTriggerEngine;
    let fakeContainer;
    let configuration;
    let eventbus;
    let provider;

    beforeEach(() => {
      ChronoTriggerEngine = null;
      fakeContainer = null;
      configuration = {};
      eventbus = {};
      provider = {};

      const inject = require('inject-loader!../src/chrono-trigger-engine');

        ChronoTriggerEngine = inject({
            'jquery': jQueryStub
          }).default;
    });

    function jQueryStub(selector) {
        return fakeContainer;
    }

    function setupLayoutInit() {
      configuration.layoutTemplate = '<div/>';
      configuration.containerSelector = '.test';
      
      fakeContainer = {
        html: sinon.stub().withArgs(configuration.layoutTemplate),
        length: 1
      };
    }
    
    function setupEventbus() {
      eventbus = {
        on: sinon.stub()
      }
    }

    it('should create an engine', () => {
      // test
      const engine = new ChronoTriggerEngine(configuration, eventbus, provider);

      // expect
      expect(engine).to.not.equal(null);
      expect(engine.configuration).to.equal(configuration);
      expect(engine.eventbus).to.equal(eventbus);
      expect(engine.timelineProvider).to.equal(provider);
    });

    it('should create the layout template', () => {
      // given
      setupLayoutInit();

      const engine = new ChronoTriggerEngine(configuration, eventbus, provider);

      // test
      engine.createLayoutTemplate();
    });

    it('should throw an error when container selector cannot be resolved', () => {
      // given
      configuration.containerSelector = '.test';
      let error = null;
      const engine = new ChronoTriggerEngine(configuration, eventbus, provider);

      // test
      try{
        engine.createLayoutTemplate();
      } catch(e) {
        error = e;
      }

      // expect
      expect(error).to.not.equal(null);
      expect(error.message).to.equal('Container selector not found: .test');
    });
     
    it('should initialize eventbus listeners', () => {
      // given
      setupEventbus();

      const engine = new ChronoTriggerEngine(configuration, eventbus, provider);

      // test
      engine.addInitialisationListeners();

      // expect
      expect(engine._eventbusListeners.length).to.equal(6);
    });

    it('should initialize correctly', () => {
      // given
      setupLayoutInit();
      setupEventbus();

      const engine = new ChronoTriggerEngine(configuration, eventbus, provider);

      // test
      engine.init();

      // expect
    });
});