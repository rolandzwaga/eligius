import $ from 'jquery';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { ConfigurationFactory } from '../../configuration/api/configuration-factory';
import { IEngineConfiguration } from '../../configuration/types';
import { EngineFactory } from '../../engine-factory';
import { Eventbus, IEventbus } from '../../eventbus';
import { EligiusResourceImporter } from '../../importer';
import {
  createElement,
  requestAction,
  selectElement,
  setElementContent,
  startAction,
} from '../../operation';
import { IEligiusEngine } from '../../types';

global.cancelAnimationFrame = () => {};

const ReuseActions = suite<{
  configuration: IEngineConfiguration;
  eventbus: IEventbus;
  engine?: IEligiusEngine;
}>('Re-use actions to add pictures');

ReuseActions.before((context) => {
  context.eventbus = new Eventbus();

  $('<div data-ct-container=true></div>').appendTo(document.body);

  const factory = new ConfigurationFactory();
  factory.init('nl-NL');
  factory.setLayoutTemplate(
    '<div data-test=true><div data-anim-container="true"><div id="picture1"></div><div id="picture2"/></div></div></div>'
  );
  const settingsEditor = factory.editTimelineProviderSettings();
  settingsEditor
    .addProvider('animation')
    .setSystemName('RequestAnimationFrameTimelineProvider')
    .setSelector('[data-anim-container=true]');

  factory
    .addLanguage('nl-NL', 'Nederlands')
    .addLanguage('en-GB', 'English')
    .addTimeline(
      'my-anim',
      'animation',
      100,
      false,
      '[data-anim-container=true]'
    );

  factory
    .createAction('AddImage')
    .addStartOperationByType(selectElement, {})
    .addStartOperationByType(createElement, {
      elementName: 'img',
    })
    .addStartOperationByType(setElementContent, {});

  factory
    .createInitAction('Add two images')
    .addStartOperationByType(requestAction, { systemName: 'AddImage' })
    .addStartOperationByType(startAction, {
      actionOperationData: {
        selector: '#picture1',
        attributes: {
          src: 'images/picture1.png',
        },
      },
    })
    .addStartOperationByType(startAction, {
      actionOperationData: {
        selector: '#picture2',
        attributes: {
          src: 'images/picture2.png',
        },
      },
    });

  context.configuration = factory.getConfiguration();
});

ReuseActions.after(async (context) => {
  await context.engine?.destroy();
  context.eventbus.clear();
  $('[data-ct-container=true]').remove();
});

ReuseActions(
  'should add the pictures to the current template',
  async (context) => {
    const engineFactory = new EngineFactory(
      new EligiusResourceImporter(),
      window,
      {
        eventbus: context.eventbus,
      }
    );
    context.engine = engineFactory.createEngine(context.configuration);

    try {
      const result = await context.engine.init();
      assert.is.not(result, undefined);
    } catch (e) {
      throw e;
    }
  }
);

ReuseActions.run();
