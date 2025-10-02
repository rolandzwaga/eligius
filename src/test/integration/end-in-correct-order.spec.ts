import $ from 'jquery';

import {describe, test} from 'vitest';
import {ConfigurationFactory} from '../../configuration/api/index.ts';
import {EngineFactory} from '../../engine-factory.ts';
import {Eventbus} from '../../eventbus/index.ts';
import {EligiusResourceImporter} from '../../importer/index.ts';
import {
  removeElement,
  selectElement,
  setElementContent,
} from '../../operation/index.ts';

describe.concurrent('EndInCorrectOrder', () => {
  test('The ending of actions need to be called in reverse order', async () => {
    $('<div data-ct-container=true></div>').appendTo(document.body);
    const factory = new ConfigurationFactory();
    factory.init('nl-NL');
    factory.setLayoutTemplate(
      '<div data-test=true><div data-anim-container="true"></div></div>'
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
      .createInitAction('Add main container')
      .addStartOperationByType(selectElement, {
        selector: '[data-anim-container]',
      })
      .addStartOperationByType(setElementContent, {
        template: '<div class="main"></div>',
        insertionType: 'append',
      })
      .addEndOperationByType(selectElement, {
        selector: '[data-anim-container]',
      })
      .addEndOperationByType(removeElement, {})
      .next()
      .createInitAction('Add element to main container')
      .addStartOperationByType(selectElement, {selector: '.main'})
      .addStartOperationByType(setElementContent, {
        template: '<div class="sub-container"></div>',
      })
      .addEndOperationByType(selectElement, {selector: '.sub-container'})
      .addEndOperationByType(removeElement, {});

    const configuration = factory.getConfiguration();

    const engineFactory = new EngineFactory(
      new EligiusResourceImporter(),
      window,
      {
        eventbus: new Eventbus(),
      }
    );
    const engine = engineFactory.createEngine(configuration);

    await engine.init();

    await engine.destroy();
  });
});
