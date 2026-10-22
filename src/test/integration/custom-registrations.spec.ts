import {ConfigurationFactory} from '@configuration/api/index.ts';
import type {IController} from '@controllers/types.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {EligiusResourceImporter} from '@importer/index.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';
import $ from 'jquery';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {EngineFactory} from '@/engine-factory.ts';
import type {IEngineFactoryResult} from '@/types.ts';

/**
 * Custom operations, functions, controllers, templates and JSON registered with
 * the EligiusResourceImporter, authored with the fluent API and run by a
 * factory-built engine (real Eventbus, adapters and RafPositionSource; only
 * animationInterval is mocked so the RAF clock is driven by hand).
 */
const raf = vi.hoisted(() => ({
  callback: null as ((elapsed: number) => void) | null,
  signal: null as AbortSignal | null,
}));

vi.mock('@util/animation-interval.ts', () => ({
  animationInterval: vi.fn(
    (_ms: number, signal: AbortSignal, callback: (elapsed: number) => void) => {
      raf.callback = callback;
      raf.signal = signal;
    }
  ),
}));

function tick(elapsedMs: number) {
  if (raf.signal && !raf.signal.aborted) {
    raf.callback?.(elapsedMs);
  }
}

interface IRecordCallOperationData {
  label: string;
  settings?: unknown;
}

describe('Custom registrations through EngineFactory (integration)', () => {
  let calls: Array<{label: string; settings: unknown; hasEventbus: boolean}>;
  let functionCalls: Array<{label: unknown; hasEventbus: boolean}>;
  let attached: IEventbus[];
  let eventbus: Eventbus;
  let engineFactory: EngineFactory;
  let result: IEngineFactoryResult | undefined;

  const settings = {colors: ['red', 'green'], speed: 2};

  const recordCall: TOperation<IRecordCallOperationData> = function (
    this: IOperationScope,
    operationData
  ) {
    calls.push({
      label: operationData.label,
      settings: operationData.settings,
      hasEventbus: Boolean(this.eventbus),
    });
    return operationData;
  };

  function markStage(this: IOperationScope, operationData: {label?: string}) {
    functionCalls.push({
      label: operationData.label,
      hasEventbus: Boolean(this.eventbus),
    });
    $('#stage').attr('data-marked', 'yes');
  }

  class CounterController implements IController<Record<string, unknown>> {
    name = 'CounterController';
    init() {}
    attach(bus: IEventbus) {
      attached.push(bus);
    }
    detach() {}
  }

  function createImporter() {
    return new EligiusResourceImporter({
      operations: {recordCall},
      functions: {markStage},
      controllers: {CounterController},
      templates: {layout: '<div id="stage"></div>'},
      json: {settings},
    });
  }

  function createConfiguration() {
    const factory = new ConfigurationFactory(undefined, {
      customOperations: ['recordCall'],
    });
    factory
      .init('en-US')
      .setContainerSelector('#engine-root')
      .setLayoutTemplate('template:layout')
      .addTimeline('main', 'animation', 10, false, '#stage')
      .editTimelineProviderSettings()
      .addProvider('animation')
      .setPositionSourceByName('RafPositionSource', {tickInterval: 100})
      .setContainer('#stage');

    factory
      .createInitAction('Setup')
      .addStartOperation('recordCall', {
        label: 'init',
        settings: 'json:settings',
      })
      .addStartOperation('customFunction', {systemName: 'markStage'})
      .addStartOperation('selectElement', {selector: '#stage'})
      .addStartOperation('getControllerInstance', {
        // The operation data type only lists the built-in controller names
        systemName: 'CounterController' as any,
      })
      .addStartOperation('addControllerToElement', {});

    factory
      .createTimelineAction('main', 'Intro')
      .addDuration(0.2, 1)
      .addStartOperation('recordCall', {label: 'intro-start'})
      .addEndOperation('recordCall', {label: 'intro-end'});

    return factory.getConfiguration();
  }

  beforeEach(() => {
    raf.callback = null;
    raf.signal = null;
    calls = [];
    functionCalls = [];
    attached = [];
    $('<div id="engine-root"></div>').appendTo(document.body);
    eventbus = new Eventbus();
    engineFactory = new EngineFactory(createImporter(), window, {eventbus});
    result = undefined;
  });

  afterEach(async () => {
    if (result) {
      await result.destroy().catch(() => {});
    }
    engineFactory.destroy();
    $('#engine-root').remove();
  });

  test('given a fluent configuration with a registered operation, function, controller, template: and json: placeholder, when the engine runs, then each registered resource is used', async () => {
    // given
    const configuration = createConfiguration();

    // test
    result = engineFactory.createEngine(configuration);
    await result.engine.init();

    // expect: init action ran the registered operation, function and controller
    expect($('#engine-root #stage').length).toBe(1);
    expect(calls).toEqual([{label: 'init', settings, hasEventbus: true}]);
    expect(calls[0].settings).not.toBe(settings);
    expect(functionCalls).toEqual([{label: 'init', hasEventbus: true}]);
    expect($('#stage').attr('data-marked')).toBe('yes');
    expect(attached).toEqual([eventbus]);

    // test: the timeline action with the registered operation
    await result.engine.start();
    tick(300);
    expect(calls.map(call => call.label)).toEqual(['init', 'intro-start']);
    tick(1200);
    expect(calls.map(call => call.label)).toEqual([
      'init',
      'intro-start',
      'intro-end',
    ]);
  });

  test('given a configuration with a misspelled registered operation, when the engine is created, then it throws suggesting the registered name', () => {
    // given
    const configuration = createConfiguration();
    configuration.initActions[0].startOperations[0].systemName = 'recordCal';

    // test + expect
    expect(() => engineFactory.createEngine(configuration)).toThrowError(
      "Unknown operation 'recordCal' at initActions[0].startOperations[0].systemName. Did you mean 'recordCall'?"
    );
  });

  test('given registered json entries with falsy values, when getImport requests them through the factory, then 0, empty string and false are returned instead of failing', () => {
    const eventbus = new Eventbus();
    const factory = new EngineFactory(
      new EligiusResourceImporter({json: {zero: 0, empty: '', off: false}}),
      window,
      {eventbus}
    );

    expect(eventbus.request('request-function', 'zero')).toBe(0);
    expect(eventbus.request('request-function', 'empty')).toBe('');
    expect(eventbus.request('request-function', 'off')).toBe(false);
    expect(() => eventbus.request('request-function', 'missing')).toThrow();
    factory.destroy();
  });
});
