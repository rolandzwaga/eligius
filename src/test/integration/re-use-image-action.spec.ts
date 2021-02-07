import { expect } from 'chai';
import $ from 'jquery';
import { ConfigurationFactory } from '../../configuration/api/configuration-factory';
import { IEngineConfiguration } from '../../configuration/types';
import { EngineFactory } from '../../engine-factory';
import { Eventbus } from '../../eventbus';
import { WebpackResourceImporter } from '../../importer';
import { createElement, requestAction, selectElement, setElementContent, startAction } from '../../operation';
import { IChronoTriggerEngine } from '../../types';

fdescribe('Re-use actions to add pictures', () => {
  let configuration: IEngineConfiguration | null = null;
  let eventbus: Eventbus;
  let engine: IChronoTriggerEngine;

  beforeEach(() => {
    eventbus = new Eventbus();

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
      .addTimeline('my-anim', 'animation', 100, false, '[data-anim-container=true]');

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

    factory.getConfiguration((config) => {
      configuration = config;
      return undefined;
    });
  });

  /*afterEach(async () => {
    await engine.destroy();
    eventbus.clear();
    $('[data-ct-container=true]').remove();
  });*/

  it('should add the pictures to the current template', async () => {
    const engineFactory = new EngineFactory(new WebpackResourceImporter(), window, eventbus);
    engine = engineFactory.createEngine(configuration as IEngineConfiguration);

    try {
      const result = await engine.init();
      expect(result).to.not.be.undefined;
    } catch (e) {
      throw e;
    }
  });
});
