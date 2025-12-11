import {ConfigurationFactory} from '@configuration/api/configuration-factory.ts';
import type {IEngineConfiguration} from '@configuration/types.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {EligiusResourceImporter} from '@importer/index.ts';
import {
  createElement,
  requestAction,
  selectElement,
  setElementContent,
  startAction,
} from '@operation/index.ts';
import $ from 'jquery';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type TestContext,
  test,
} from 'vitest';
import {EngineFactory} from '../../engine-factory.ts';
import type {IEligiusEngine} from '../../types.ts';

type ReuseActionsContext = {
  configuration: IEngineConfiguration;
  eventbus: IEventbus;
  engine?: IEligiusEngine;
} & TestContext;

describe<ReuseActionsContext>('Re-use actions to add pictures', () => {
  global.cancelAnimationFrame = () => {};
  beforeEach<ReuseActionsContext>(context => {
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
      .setContainer('[data-anim-container=true]');

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
      .addStartOperationByType(requestAction, {systemName: 'AddImage'})
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
  afterEach<ReuseActionsContext>(async context => {
    await context.engine?.destroy();
    context.eventbus.clear();
    $('[data-ct-container=true]').remove();
  });
  test<ReuseActionsContext>('should add the pictures to the current template', async context => {
    const engineFactory = new EngineFactory(
      new EligiusResourceImporter(),
      window,
      {
        eventbus: context.eventbus,
      }
    );
    const {engine} = engineFactory.createEngine(context.configuration);
    context.engine = engine;

    const result = await context.engine.init();
    expect(result).not.toBeUndefined();

    // Verify that both images were added to their respective containers
    const img1 = $('#picture1 img');
    const img2 = $('#picture2 img');

    expect(img1.length).toBe(1);
    expect(img2.length).toBe(1);
    expect(img1.attr('src')).toBe('images/picture1.png');
    expect(img2.attr('src')).toBe('images/picture2.png');
  });
});
