import type {IEngineConfiguration} from '@configuration/types.ts';
import {EligiusResourceImporter} from '@importer/index.ts';
import hotkeys from 'hotkeys-js';
import $ from 'jquery';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {EngineFactory} from '@/engine-factory.ts';
import type {IEngineFactoryOptions, IEngineFactoryResult} from '@/types.ts';

/**
 * Input bindings of factory-created engines with the real EngineInputAdapter
 * and the real hotkeys-js: key presses are real keydown events dispatched on
 * the document. Only animationInterval is mocked, so no clock runs.
 */
vi.mock('@util/animation-interval.ts', () => ({
  animationInterval: vi.fn(),
}));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

function createConfig(name: string): IEngineConfiguration {
  return {
    id: `input-${name}`,
    engine: {systemName: 'EligiusEngine'},
    timelineProviderSettings: {
      animation: {
        positionSource: {systemName: 'RafPositionSource', tickInterval: 100},
        container: {
          systemName: 'DomContainerProvider',
          selector: `#stage-${name}`,
        },
      },
    },
    containerSelector: `#engine-${name}`,
    cssFiles: [],
    language: 'en-US',
    layoutTemplate: `<div id="stage-${name}"></div>`,
    availableLanguages: [],
    initActions: [],
    actions: [],
    timelines: [
      {
        id: `t-${name}`,
        uri: `t-${name}`,
        type: 'animation',
        duration: 10,
        loop: false,
        selector: `#stage-${name}`,
        timelineActions: [],
      },
    ],
  };
}

const keyCodes: Record<string, number> = {' ': 32, k: 75, j: 74};

/** Presses a key with real keydown and keyup events, as a browser would. */
function press(key: string, target: EventTarget = document.body) {
  for (const type of ['keydown', 'keyup']) {
    const event = new KeyboardEvent(type, {key, bubbles: true});
    Object.defineProperty(event, 'keyCode', {value: keyCodes[key]});
    target.dispatchEvent(event);
  }
}

describe('Engine input bindings (integration)', () => {
  let results: IEngineFactoryResult[];
  let factories: EngineFactory[];

  beforeEach(() => {
    results = [];
    factories = [];
    $('<div id="engine-a"></div><div id="engine-b"></div>').appendTo(
      document.body
    );
  });

  afterEach(async () => {
    for (const result of results) {
      await result.destroy().catch(() => {});
    }
    factories.forEach(factory => factory.destroy());
    $('#engine-a, #engine-b').remove();
  });

  async function create(name: string, options?: IEngineFactoryOptions) {
    const factory = new EngineFactory(
      new EligiusResourceImporter(),
      window,
      options
    );
    factories.push(factory);
    const result = factory.createEngine(createConfig(name));
    results.push(result);
    await result.engine.init();
    return result;
  }

  test('given one engine with default options, when space is pressed with nothing focused, then it plays and a second press pauses it', async () => {
    const {engine} = await create('a');

    press(' ');
    await flush();
    expect(engine.playState).toBe('playing');

    press(' ');
    await flush();
    expect(engine.playState).toBe('paused');
  });

  test('given two engines with default options, when space is pressed with nothing focused, then only one of them plays', async () => {
    const a = await create('a');
    const b = await create('b');

    press(' ');
    await flush();

    expect(a.engine.playState).toBe('playing');
    expect(b.engine.playState).toBe('stopped');
  });

  test('given two engines and a click inside the second one, when space is pressed with nothing focused, then only the second one toggles', async () => {
    const a = await create('a');
    const b = await create('b');

    document
      .querySelector('#stage-b')!
      .dispatchEvent(new Event('pointerdown', {bubbles: true}));
    press(' ');
    await flush();

    expect(b.engine.playState).toBe('playing');
    expect(a.engine.playState).toBe('stopped');
  });

  test("given two engines with scope 'engineRoot', when space is pressed with nothing focused, then neither plays and the key keeps its default action", async () => {
    const a = await create('a', {input: {scope: 'engineRoot'}});
    const b = await create('b', {input: {scope: 'engineRoot'}});
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'keyCode', {value: 32});

    document.body.dispatchEvent(event);
    await flush();

    expect(event.defaultPrevented).toBe(false);
    expect(a.engine.playState).toBe('stopped');
    expect(b.engine.playState).toBe('stopped');
  });

  test("given scope 'engineRoot', when space is pressed with the focus inside the engine root, then that engine plays", async () => {
    const a = await create('a', {input: {scope: 'engineRoot'}});
    const b = await create('b', {input: {scope: 'engineRoot'}});
    const stage = document.querySelector<HTMLElement>('#stage-b')!;
    stage.tabIndex = 0;
    stage.focus();

    press(' ', stage);
    await flush();

    expect(b.engine.playState).toBe('playing');
    expect(a.engine.playState).toBe('stopped');
  });

  test('given input.playToggle k, when k and space are pressed, then only k toggles playback', async () => {
    const {engine} = await create('a', {input: {playToggle: 'k'}});

    press(' ');
    await flush();
    expect(engine.playState).toBe('stopped');

    press('k');
    await flush();
    expect(engine.playState).toBe('playing');
  });

  test('given the deprecated playToggleHotkey j, when j is pressed, then playback toggles', async () => {
    const {engine} = await create('a', {playToggleHotkey: 'j'});

    press('j');
    await flush();

    expect(engine.playState).toBe('playing');
  });

  test('given input.playToggle and the deprecated playToggleHotkey, when both keys are pressed, then only input.playToggle toggles', async () => {
    const {engine} = await create('a', {
      playToggleHotkey: 'j',
      input: {playToggle: 'k'},
    });

    press('j');
    await flush();
    expect(engine.playState).toBe('stopped');

    press('k');
    await flush();
    expect(engine.playState).toBe('playing');
  });

  test('given input.resize false, when the engine is created, then no window resize listener is added', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    await create('a', {input: {resize: false}});

    expect(addSpy.mock.calls.some(([type]) => type === 'resize')).toBe(false);
  });

  test('given default options, when the engine is created, then a window resize listener is added', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    await create('a');

    expect(addSpy.mock.calls.some(([type]) => type === 'resize')).toBe(true);
  });

  test('given 20 engines created and destroyed in turn, when they are all gone, then hotkeys-js holds no binding', async () => {
    for (let i = 0; i < 20; i++) {
      const result = await create(i % 2 ? 'a' : 'b', {
        input: i % 3 ? {} : {playToggle: 'k', scope: 'engineRoot'},
      });
      await result.destroy();
    }

    expect(hotkeys.getAllKeyCodes()).toEqual([]);
  });

  test('given a factory-created engine, when it is destroyed with engine.destroy() instead of the factory destroy(), then hotkeys-js holds no binding of it', async () => {
    const {engine} = await create('a');

    await engine.destroy();

    expect(hotkeys.getAllKeyCodes()).toEqual([]);
  });
});
