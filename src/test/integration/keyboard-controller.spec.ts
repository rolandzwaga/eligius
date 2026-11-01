import type {
  IEngineConfiguration,
  IOperationConfiguration,
} from '@configuration/types.ts';
import {EligiusResourceImporter} from '@importer/index.ts';
import type {TOperationData} from '@operation/types.ts';
import hotkeys from 'hotkeys-js';
import $ from 'jquery';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {EngineFactory} from '@/engine-factory.ts';
import type {IEngineFactoryResult} from '@/types.ts';

/**
 * KeyboardController on a real engine with the real EngineInputAdapter and
 * the real hotkeys-js, configured the way Eligian compiles
 * `on key "ArrowRight" seek ...`. Only animationInterval is mocked, so no
 * clock runs.
 */
vi.mock('@util/animation-interval.ts', () => ({
  animationInterval: vi.fn(),
}));

let opId = 0;
const op = (
  systemName: string,
  operationData?: TOperationData
): IOperationConfiguration<TOperationData> => ({
  id: `op-${++opId}`,
  systemName,
  operationData,
});

const rafSource = {systemName: 'RafPositionSource', tickInterval: 100};
const stepSource = {systemName: 'KeyboardStepSource', verticalMode: 'disabled'};

function createConfig(
  controllerData: TOperationData,
  positionSource: {systemName: string} = rafSource
): IEngineConfiguration {
  return {
    id: 'keyboard-controller',
    engine: {systemName: 'EligiusEngine'},
    timelineProviderSettings: {
      animation: {
        positionSource,
        container: {systemName: 'DomContainerProvider', selector: '#stage'},
      },
    },
    containerSelector: '#engine',
    cssFiles: [],
    language: 'en-US',
    layoutTemplate: '<div id="stage"></div><div id="aside" tabindex="0"></div>',
    availableLanguages: [],
    initActions: [
      {
        id: 'init-keys',
        name: 'AddKeys',
        startOperations: [
          op('selectElement', {selector: '#stage'}),
          op('getControllerInstance', {systemName: 'KeyboardController'}),
          op('addControllerToElement', controllerData),
        ],
        endOperations: [
          op('selectElement', {selector: '#stage'}),
          op('removeControllerFromElement', {
            controllerName: 'KeyboardController',
          }),
        ],
      },
    ],
    actions: [
      {
        id: 'seek-5',
        name: '__on__seek__4',
        startOperations: [
          op('broadcastEvent', {
            eventName: 'timeline-seek-request',
            eventArgs: [5],
          }),
        ],
        endOperations: [],
      },
    ],
    timelines: [
      {
        id: 't',
        uri: 't',
        type: 'animation',
        duration: 10,
        loop: false,
        selector: '#stage',
        timelineActions: [],
      },
    ],
  };
}

const keyCodes: Record<string, number> = {' ': 32};

/** Presses a key with real keydown and keyup events, as a browser would. */
function press(
  key: string,
  target: EventTarget = document.body,
  init: KeyboardEventInit = {}
) {
  for (const type of ['keydown', 'keyup']) {
    const event = new KeyboardEvent(type, {key, bubbles: true, ...init});
    if (keyCodes[key]) {
      Object.defineProperty(event, 'keyCode', {value: keyCodes[key]});
    }
    target.dispatchEvent(event);
  }
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('KeyboardController (integration)', () => {
  let result: IEngineFactoryResult | undefined;
  let factory: EngineFactory | undefined;

  beforeEach(() => {
    $('<div id="engine"></div>').appendTo(document.body);
  });

  afterEach(async () => {
    await result?.destroy().catch(() => {});
    factory?.destroy();
    result = undefined;
    factory = undefined;
    $('#engine').remove();
  });

  async function create(
    controllerData: TOperationData,
    positionSource?: {systemName: string}
  ) {
    factory = new EngineFactory(new EligiusResourceImporter(), window);
    result = factory.createEngine(createConfig(controllerData, positionSource));
    await result.engine.init();
    return result;
  }

  test('given a KeyboardController whose action broadcasts timeline-seek-request, when ArrowRight is pressed, then the engine seeks', async () => {
    const {engine} = await create({
      keys: 'ArrowRight',
      actions: ['__on__seek__4'],
    });
    expect(engine.position).toBe(0);

    press('ArrowRight');

    await vi.waitFor(() => expect(engine.position).toBe(5));
  });

  test('given a KeyboardController on space, when space is pressed with nothing focused, then its action runs and the play toggle does not', async () => {
    const {engine} = await create({keys: 'space', actions: ['__on__seek__4']});

    press(' ');

    await vi.waitFor(() => expect(engine.position).toBe(5));
    await flush();
    expect(engine.playState).toBe('stopped');
  });

  test("given a KeyboardController on space with scope 'element', when space is pressed with the focus outside the element, then the play toggle still toggles", async () => {
    const {engine} = await create({
      keys: 'space',
      actions: ['__on__seek__4'],
      scope: 'element',
    });
    const aside = document.querySelector<HTMLElement>('#aside')!;
    aside.focus();

    press(' ', aside);
    await flush();

    expect(engine.playState).toBe('playing');
    expect(engine.position).toBe(0);
  });

  test('given a KeyboardStepSource timeline and a KeyboardController on ArrowRight, when ArrowRight is pressed, then the controller seeks and the source does not step', async () => {
    const {engine} = await create(
      {keys: 'ArrowRight', actions: ['__on__seek__4']},
      stepSource
    );
    await engine.start();

    press('ArrowRight');

    await vi.waitFor(() => expect(engine.position).toBe(5));
    await flush();
    expect(engine.position).toBe(5);
  });

  test('given a KeyboardStepSource timeline and a KeyboardController on ArrowRight, when ArrowLeft and shift+ArrowRight are pressed, then the source still steps', async () => {
    const {engine} = await create(
      {keys: 'ArrowRight', actions: ['__on__seek__4']},
      stepSource
    );
    await engine.start();

    press('ArrowRight', document.body, {shiftKey: true});
    await vi.waitFor(() => expect(engine.position).toBe(10));
    press('ArrowLeft');

    await vi.waitFor(() => expect(engine.position).toBe(9));
  });

  test("given a KeyboardStepSource timeline and a KeyboardController on ArrowRight with scope 'element', when ArrowRight is pressed with nothing focused, then the source steps", async () => {
    const {engine} = await create(
      {keys: 'ArrowRight', actions: ['__on__seek__4'], scope: 'element'},
      stepSource
    );
    await engine.start();

    press('ArrowRight');

    await vi.waitFor(() => expect(engine.position).toBe(1));
  });

  test('given a KeyboardController, when the engine is destroyed, then hotkeys-js holds no binding', async () => {
    const created = await create({keys: 'ArrowRight', actions: ['__on__seek__4']});

    await created.destroy();
    result = undefined;

    expect(hotkeys.getAllKeyCodes()).toEqual([]);
  });
});
