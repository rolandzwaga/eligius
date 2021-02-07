import { expect } from 'chai';
import $ from 'jquery';
import { ConfigurationFactory } from '../../configuration/api/configuration-factory';
import { IEngineConfiguration } from '../../configuration/types';
import { EngineFactory } from '../../engine-factory';
import { Eventbus } from '../../eventbus';
import { WebpackResourceImporter } from '../../importer';
import {
  addControllerToElement,
  broadcastEvent,
  createElement,
  endLoop,
  getControllerInstance,
  log,
  removeControllerFromElement,
  selectElement,
  setElementContent,
  startLoop,
} from '../../operation';
import { TimelineEventNames } from '../../timeline-event-names';
import { IChronoTriggerEngine } from '../../types';

describe('Create option list', () => {
  let configuration: IEngineConfiguration | null = null;
  let eventbus: Eventbus;
  let engine: IChronoTriggerEngine;

  beforeEach(() => {
    eventbus = new Eventbus();

    $('<div data-ct-container=true></div>').appendTo(document.body);

    const factory = new ConfigurationFactory();
    factory.init('nl-NL');
    factory.setLayoutTemplate('<div data-test=true><div data-anim-container="true"/></div>');
    const settingsEditor = factory.editTimelineProviderSettings();
    settingsEditor
      .addProvider('animation')
      .setSystemName('RequestAnimationFrameTimelineProvider')
      .setSelector('[data-anim-container=true]');

    const actionCreator = factory
      .addLanguage('nl-NL', 'Nederlands')
      .addLanguage('en-GB', 'English')
      .addTimeline('my-anim', 'animation', 100, false, '[data-anim-container=true]')
      .createInitAction('CreateLanguageSelector');

    actionCreator
      .addStartOperationByType(selectElement, { selector: '[data-test=true]' })
      .addStartOperationByType(createElement, {
        elementName: 'select',
        attributes: {
          ['data-language-selector']: 'true',
          defaultValue: 'nl-NL',
        },
      })
      .addStartOperationByType(setElementContent, { insertionType: 'prepend' })
      .addStartOperationByType(selectElement, { selector: '[data-language-selector=true]' })
      .addStartOperationByType(startLoop, { collection: 'config:availableLanguages' })
      .addStartOperationByType(createElement, {
        elementName: 'option',
        attributes: {
          value: 'operationdata.currentItem.languageCode',
        },
        text: 'operationdata.currentItem.label',
      })
      .addStartOperationByType(setElementContent, { insertionType: 'append' })
      .addStartOperationByType(endLoop, {})
      .addStartOperationByType(getControllerInstance, { systemName: 'EventListenerController' })
      .addStartOperationByType(addControllerToElement, {
        eventName: 'change',
        actions: ['BroadcastLanguageChange'],
      })
      .addEndOperationByType(selectElement, { selector: '[data-language-selector=true]' })
      .addEndOperationByType(log, {})
      .addEndOperationByType(removeControllerFromElement, { controllerName: 'EventListenerController' });

    const eventActionCreator = factory.createEventAction('BroadcastLanguageChange');
    eventActionCreator.addStartOperationByType(broadcastEvent, {
      eventName: TimelineEventNames.LANGUAGE_CHANGE,
      eventArgs: ['operationData.targetValue'],
    });

    factory.getConfiguration((config) => {
      configuration = config;
      return undefined;
    });
  });

  afterEach(async () => {
    await engine.destroy();
    eventbus.clear();
    $('[data-ct-container=true]').remove();
  });

  it('should create a selector and attach a change controller', async () => {
    let selectedLang = '';
    eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, (languageCode) => {
      selectedLang = languageCode;
    });

    const engineFactory = new EngineFactory(new WebpackResourceImporter(), window, eventbus);
    engine = engineFactory.createEngine(configuration as IEngineConfiguration);

    try {
      const result = await engine.init();
      expect(result).to.not.be.undefined;
      $('[data-language-selector=true]').val('en-GB').trigger('change');
      expect(selectedLang).to.equal('en-GB');
    } catch (e) {
      throw e;
    }
  });
});
