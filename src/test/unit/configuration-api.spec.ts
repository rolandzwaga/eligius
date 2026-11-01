// @vitest-environment node

import {describe, expect, test, vi} from 'vitest';
import * as configurationApi from '@/configuration-api.ts';

// See src/test/unit/configuration/api/node-environment.spec.ts: any import of a
// peer dependency fails this spec.
vi.mock('jquery', () => {
  throw new Error('eligius/configuration-api must not import jquery');
});
vi.mock('lottie-web', () => {
  throw new Error('eligius/configuration-api must not import lottie-web');
});

describe('eligius/configuration-api entry point', () => {
  test('given no DOM, when the entry is imported, then it exports the fluent API', () => {
    expect(typeof window).toBe('undefined');
    expect(Object.keys(configurationApi).sort()).toEqual(
      [
        'ActionCreator',
        'ActionCreatorFactory',
        'ActionEditor',
        'ConfigurationFactory',
        'ControllerNamesProvider',
        'EndableActionCreator',
        'EndableActionEditor',
        'OperationEditor',
        'OperationMetadataProvider',
        'OperationNamesProvider',
        'SubtitleEditor',
        'SubtitleImporter',
        'TimelineActionCreator',
        'TimelineActionEditor',
        'TimelineProviderSettingsEditor',
        'TimelineProvidersSettingsEditor',
      ].sort()
    );
  });

  test('given the entry, when a configuration is built, then it is returned as plain JSON data', () => {
    const factory = new configurationApi.ConfigurationFactory();
    factory
      .init('nl-NL')
      .setContainerSelector('#app')
      .addTimeline('main', 'animation', 10, false, '#timeline');
    factory
      .createInitAction('Setup')
      .addStartOperation('selectElement', {selector: '#app'})
      .addEndOperation('removeElement', {})
      .next()
      .end();

    const config = factory.getConfiguration();
    expect(config.initActions[0].startOperations[0].systemName).toBe(
      'selectElement'
    );
    expect(JSON.parse(JSON.stringify(config))).toEqual(config);
  });
});
