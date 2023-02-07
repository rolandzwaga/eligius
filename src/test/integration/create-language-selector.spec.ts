import $ from 'jquery';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { ConfigurationFactory } from '../../configuration/api/configuration-factory';
import { IEngineConfiguration } from '../../configuration/types';
import { EngineFactory } from '../../engine-factory';
import { Eventbus } from '../../eventbus';
import { EligiusResourceImporter } from '../../importer';
import {
  addControllerToElement,
  broadcastEvent,
  createElement,
  endForEach,
  endWhen,
  forEach,
  getControllerInstance,
  otherwise,
  removeControllerFromElement,
  removePropertiesFromOperationData,
  selectElement,
  setElementContent,
  setOperationData,
  when,
} from '../../operation';
import { TimelineEventNames } from '../../timeline-event-names';
import { IEligiusEngine } from '../../types';

const CreateOptionList = suite<{
  configuration: IEngineConfiguration;
  eventbus: Eventbus;
  engine: IEligiusEngine;
  cancelAnimationFrame: typeof global.cancelAnimationFrame;
}>('Create option list');

CreateOptionList.before((context) => {
  context.cancelAnimationFrame = global.cancelAnimationFrame;
  global.cancelAnimationFrame = () => {};
  context.eventbus = new Eventbus();

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
        'data-language-selector': 'true',
      },
    })
    .addStartOperationByType(setElementContent, { insertionType: 'prepend' })
    .addStartOperationByType(selectElement, {
      selector: '[data-language-selector=true]',
    })
    .addStartOperationByType(forEach, {
      collection: 'config:availableLanguages',
    })
    .addStartOperationByType(when, {
      expression: 'context.parent.currentItem.languageCode==globaldata.defaultLanguage',
    })
    .addStartOperationByType(setOperationData, {
      properties: {
        isSelectedItem: true,
      },
    })
    .addStartOperationByType(otherwise, {})
    .addStartOperationByType(removePropertiesFromOperationData, {
      propertyNames: ['isSelectedItem'],
    })
    .addStartOperationByType(endWhen, {})
    .addStartOperationByType(createElement, {
      elementName: 'option',
      attributes: {
        value: 'context.currentItem.languageCode',
        selected: 'operationData.isSelectedItem',
      },
      text: 'context.currentItem.label',
    })
    .addStartOperationByType(setElementContent, { insertionType: 'append' })
    .addStartOperationByType(endForEach, {})
    .addStartOperationByType(getControllerInstance, {
      systemName: 'EventListenerController',
    })
    .addStartOperationByType(addControllerToElement, {
      eventName: 'change',
      actions: ['BroadcastLanguageChange'],
    } as any)
    .addEndOperationByType(selectElement, {
      selector: '[data-language-selector=true]',
    })
    .addEndOperationByType(removeControllerFromElement, {
      controllerName: 'EventListenerController',
    });

  const eventActionCreator = factory.createEventAction('BroadcastLanguageChange');
  eventActionCreator.addStartOperationByType(broadcastEvent, {
    eventName: TimelineEventNames.LANGUAGE_CHANGE,
    eventArgs: ['operationData.eventTarget.value'],
  });

  context.configuration = factory.getConfiguration();
});

CreateOptionList.after(async (context) => {
  await context.engine?.destroy();
  context.eventbus.clear();
  $('[data-ct-container=true]').remove();
  global.cancelAnimationFrame = context.cancelAnimationFrame;
});

CreateOptionList(
  'should create a selector and attach a change controller',
  async (context) => {
    let selectedLang = '';
    context.eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, (languageCode) => {
      selectedLang = languageCode;
    });

    const engineFactory = new EngineFactory(
      new EligiusResourceImporter(),
      window,
      {
        eventbus: context.eventbus,
      }
    );
    context.engine = engineFactory.createEngine(
      context.configuration as IEngineConfiguration
    );

    try {
      const result = await context.engine.init();
      assert.is.not(result, undefined);
      $('[data-language-selector=true]').val('en-GB').trigger('change');

      assert.is(selectedLang, 'en-GB');
    } catch (e) {
      throw e;
    }
  }
);

CreateOptionList.run();
