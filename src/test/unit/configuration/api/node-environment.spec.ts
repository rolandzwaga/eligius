// @vitest-environment node
import {ActionEditor} from '@configuration/api/action-editor.ts';
import {ConfigurationFactory} from '@configuration/api/configuration-factory.ts';
import {
  ControllerNamesProvider,
  OperationMetadataProvider,
  OperationNamesProvider,
} from '@configuration/api/name-providers.ts';
import {describe, expect, test, vi} from 'vitest';

// The fluent API must not load the peer dependencies. jquery@4 already throws
// without a DOM, but lottie-web does not, and src/test/setup.ts mocks
// lottie-web for every spec. These factories make any import of the two fail.
vi.mock('jquery', () => {
  throw new Error('the fluent configuration API must not import jquery');
});
vi.mock('lottie-web', () => {
  throw new Error('the fluent configuration API must not import lottie-web');
});

describe('Fluent configuration API in a DOM-less Node environment', () => {
  test('given no DOM, when the fluent API is imported, then there is no window or document', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    expect(ActionEditor).toBeDefined();
  });

  test('given no DOM, when a configuration is built with operation names, then it contains the operations', () => {
    const factory = new ConfigurationFactory();
    factory
      .init('en-US')
      .setContainerSelector('#app')
      .addTimeline('main', 'animation', 60, false, '#timeline');

    factory
      .createTimelineAction('main', 'ShowTitle')
      .addDuration(0.5, 3)
      .addStartOperation('selectElement', {selector: '#title'})
      .addStartOperation('addClass', {className: 'show'})
      .addEndOperation('removeClass', {className: 'show'})
      .next()
      .end();

    factory
      .editTimelineAction(
        'main',
        factory.getConfiguration().timelines[0].timelineActions[0].id
      )
      .addEndOperation('selectElement', {selector: '#title'});

    const config = factory.getConfiguration();
    const [action] = config.timelines[0].timelineActions;
    expect(action.startOperations.map(o => o.systemName)).toEqual([
      'selectElement',
      'addClass',
    ]);
    expect(action.endOperations.map(o => o.systemName)).toEqual([
      'removeClass',
      'selectElement',
    ]);
  });

  test('given no DOM, when an unknown operation name is added, then it throws', () => {
    const factory = new ConfigurationFactory();
    factory.init('en-US');
    const creator = factory.createAction('Bad');

    expect(() =>
      creator.addStartOperation('doesNotExist' as any, {} as any)
    ).toThrowError('Unknown operation: doesNotExist');
    expect(() =>
      creator.addEndOperation('doesNotExist' as any, {} as any)
    ).toThrowError('Unknown operation: doesNotExist');
  });

  test('given no DOM, when an operation is added by type, then it throws an error that points to the name based method', () => {
    const factory = new ConfigurationFactory();
    factory.init('en-US');
    const creator = factory.createAction('ByType');
    const someOperation = (operationData: any) => operationData;

    expect(() =>
      creator.addStartOperationByType(someOperation as any, {})
    ).toThrowError(/addStartOperation\(/);
  });

  test('given no DOM and a factory with a custom operation name, when the custom operation is added by name, then the configuration contains it', () => {
    const factory = new ConfigurationFactory(undefined, {
      customOperations: ['trackEvent'],
    });
    factory
      .init('en-US')
      .setContainerSelector('#app')
      .addTimeline('main', 'animation', 60, false, '#timeline');

    factory
      .createTimelineAction('main', 'Track')
      .addDuration(0, 1)
      .addStartOperation('trackEvent', {category: 'intro'})
      .addEndOperation('trackEvent', {category: 'outro'})
      .next()
      .end();

    factory
      .createAction('Edited')
      .next()
      .end()
      .editAction(factory.getConfiguration().actions[0].id)
      .addStartOperation('selectElement', {selector: '#app'})
      .setSystemName('trackEvent');

    const config = factory.getConfiguration();
    const [timelineAction] = config.timelines[0].timelineActions;
    expect(timelineAction.startOperations[0]).toMatchObject({
      systemName: 'trackEvent',
      operationData: {category: 'intro'},
    });
    expect(timelineAction.endOperations[0].systemName).toBe('trackEvent');
    expect(config.actions[0].startOperations[0]).toMatchObject({
      systemName: 'trackEvent',
      operationData: {selector: '#app'},
    });
  });

  test('given no DOM and a factory without the custom operation name, when the custom operation is added, then it throws explaining the customOperations option', () => {
    const factory = new ConfigurationFactory(undefined, {
      customOperations: ['trackEvent'],
    });
    factory.init('en-US');

    expect(() =>
      new ConfigurationFactory()
        .createAction('Plain')
        .addStartOperation('trackEvent', {})
    ).toThrowError(
      "Unknown operation: trackEvent. To add a custom operation, declare its name in the ConfigurationFactory options: new ConfigurationFactory(undefined, {customOperations: ['myOperation']})."
    );
    expect(() =>
      factory.createAction('Typo').addStartOperation('trackEvnt', {})
    ).toThrowError(
      /^Unknown operation: trackEvnt\. Did you mean 'trackEvent'\?/
    );
  });

  test('given no DOM, when the name providers are used, then they list the operations and controllers', () => {
    const operationNames = new OperationNamesProvider().getOperationNames();
    expect(operationNames).toContain('selectElement');
    expect(operationNames).toContain('addClass');

    const controllerNames = new ControllerNamesProvider().getControllerNames();
    expect(controllerNames).toContain('LabelController');
    expect(controllerNames).toContain('LottieController');

    const metadata = new OperationMetadataProvider().getOperationMetadata(
      'addClass'
    );
    expect(metadata.category).toBe('DOM');
  });
});
