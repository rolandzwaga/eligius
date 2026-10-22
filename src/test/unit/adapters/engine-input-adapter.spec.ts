import type {IEventbus} from '@eventbus/types.ts';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type TestContext,
  test,
  vi,
} from 'vitest';
import {
  EngineInputAdapter,
  type IEngineInputAdapterOptions,
} from '../../../adapters/engine-input-adapter.ts';
import type {IEligiusEngine} from '../../../types.ts';
import {createMockEventbus} from '../../fixtures/eventbus-factory.ts';

// Use vi.hoisted() to share mock state between vi.mock() and tests
// See specs/TESTING-GUIDE.md "Advanced: vi.hoisted() Pattern"
const hotkeysMocks = vi.hoisted(() => {
  type TBinding = {method: (...args: any[]) => any; scope: string};
  // Like hotkeys-js: a key holds every handler bound to it, bindings without
  // an explicit scope live in 'all', and an unbind without an explicit scope
  // only matches the *current* scope.
  const handlers = new Map<string, TBinding[]>();
  const state = {currentScope: 'all'};

  const resetHandlers = () => {
    handlers.clear();
    state.currentScope = 'all';
  };

  const splitKeys = (key: string) => key.replace(/\s/g, '').split(',');

  const trigger = (key: string, event: KeyboardEvent) => {
    for (const binding of [...(handlers.get(key) ?? [])]) {
      binding.method(event, {key});
    }
  };

  const bind = (key: string, option: unknown, method?: unknown) => {
    const handler = (typeof option === 'function' ? option : method) as (
      ...args: any[]
    ) => any;
    const scope =
      typeof option === 'string'
        ? option
        : ((option as {scope?: string} | undefined)?.scope ?? 'all');
    for (const single of splitKeys(key)) {
      handlers.set(single, [
        ...(handlers.get(single) ?? []),
        {method: handler, scope},
      ]);
    }
  };

  const unbind = (key: string, scopeOrMethod?: unknown, method?: unknown) => {
    const scope =
      typeof scopeOrMethod === 'string' ? scopeOrMethod : state.currentScope;
    const fn = typeof scopeOrMethod === 'function' ? scopeOrMethod : method;
    for (const single of splitKeys(key)) {
      const remaining = (handlers.get(single) ?? []).filter(
        binding => !(binding.scope === scope && (!fn || binding.method === fn))
      );
      if (remaining.length) {
        handlers.set(single, remaining);
      } else {
        handlers.delete(single);
      }
    }
  };

  return {handlers, state, resetHandlers, trigger, bind, unbind};
});

// Mock hotkeys-js using the hoisted state
vi.mock('hotkeys-js', () => {
  return {
    default: Object.assign(hotkeysMocks.bind, {
      unbind: hotkeysMocks.unbind,
      setScope: (scope: string) => {
        hotkeysMocks.state.currentScope = scope;
      },
    }),
  };
});

type AdapterSuiteContext = {
  engine: IEligiusEngine;
  eventbus: IEventbus;
  windowRef: Window & {_triggerResize: () => void};
  adapter: EngineInputAdapter;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

function createMockEngine(): IEligiusEngine {
  return {
    position: 5,
    duration: 100,
    playState: 'stopped',
    currentTimelineUri: 'timeline-1',
    container: undefined,
    engineRoot: {} as JQuery<HTMLElement>,
    on: vi.fn(() => vi.fn()),
    init: vi.fn(() => Promise.resolve({} as any)),
    destroy: vi.fn(() => Promise.resolve()),
    start: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn((pos: number) => Promise.resolve(pos)),
    switchTimeline: vi.fn(() => Promise.resolve()),
  };
}

// Adapters share a page-wide registry, so every test disconnects the
// adapters it created.
const createdAdapters: EngineInputAdapter[] = [];

function createAdapter(
  context: AdapterSuiteContext,
  options?: IEngineInputAdapterOptions,
  engine: IEligiusEngine = context.engine
): EngineInputAdapter {
  const adapter = new EngineInputAdapter(
    engine,
    context.eventbus,
    context.windowRef,
    options
  );
  createdAdapters.push(adapter);
  return adapter;
}

function keyEvent(target: EventTarget) {
  return {target, preventDefault: vi.fn()} as unknown as KeyboardEvent;
}

describe<AdapterSuiteContext>('EngineInputAdapter', () => {
  beforeEach(context => {
    withContext<AdapterSuiteContext>(context);
    hotkeysMocks.resetHandlers();

    context.engine = createMockEngine();

    context.eventbus = createMockEventbus();

    // Create mock window with helper to trigger resize
    const listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
    const mockWindow = {
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (!listeners.has(event)) {
          listeners.set(event, new Set());
        }
        listeners.get(event)!.add(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: () => void) => {
        listeners.get(event)?.delete(handler);
      }),
      _triggerResize: () => {
        const handlers = listeners.get('resize');
        if (handlers) {
          handlers.forEach(handler => handler());
        }
      },
    };
    context.windowRef = mockWindow as unknown as Window & {
      _triggerResize: () => void;
    };

    context.adapter = createAdapter(context);
  });

  afterEach(() => {
    createdAdapters.splice(0).forEach(adapter => adapter.disconnect());
  });

  describe('constructor', () => {
    test<AdapterSuiteContext>('should create an instance', context => {
      expect(context.adapter).toBeDefined();
    });

    test<AdapterSuiteContext>('given an unknown scope, when the adapter is created, then it throws naming the scope', context => {
      expect(() =>
        createAdapter(context, {scope: 'window' as 'document'})
      ).toThrow(
        "[EngineInputAdapter] Unknown input scope 'window'. Use 'document' or 'engineRoot'."
      );
    });
  });

  describe('connect()', () => {
    test<AdapterSuiteContext>('should register space hotkey', context => {
      const {adapter} = context;

      adapter.connect();

      expect(hotkeysMocks.handlers.has('space')).toBe(true);
    });

    test<AdapterSuiteContext>('given default options, when the adapter connects, then the hotkey is bound in the hotkeys-js all scope', context => {
      context.adapter.connect();

      expect(hotkeysMocks.handlers.get('space')?.[0].scope).toBe('all');
    });

    test<AdapterSuiteContext>('should register resize listener', context => {
      const {adapter, windowRef} = context;

      adapter.connect();

      expect(windowRef.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });
  });

  describe('disconnect()', () => {
    test<AdapterSuiteContext>('should remove space hotkey', context => {
      const {adapter} = context;

      adapter.connect();
      adapter.disconnect();

      expect(hotkeysMocks.handlers.has('space')).toBe(false);
    });

    test<AdapterSuiteContext>('given the hotkeys scope was switched to a KeyboardStepSource scope, when the adapter is disconnected, then space no longer toggles playback', context => {
      const {adapter, engine} = context;
      adapter.connect();
      hotkeysMocks.state.currentScope = 'keyboard-step-source-123';

      adapter.disconnect();
      hotkeysMocks.trigger('space', {
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent);

      expect(hotkeysMocks.handlers.has('space')).toBe(false);
      expect(engine.start).not.toHaveBeenCalled();
    });

    test<AdapterSuiteContext>('should remove resize listener', context => {
      const {adapter, windowRef} = context;

      adapter.connect();
      adapter.disconnect();

      expect(windowRef.removeEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    test<AdapterSuiteContext>('given two adapters on one key, when one disconnects, then only its own handler is unbound', context => {
      const other = createMockEngine();
      context.adapter.connect();
      const second = createAdapter(context, undefined, other);
      second.connect();

      second.disconnect();

      expect(hotkeysMocks.handlers.get('space')).toHaveLength(1);
      hotkeysMocks.trigger('space', keyEvent(document.body));
      expect(context.engine.start).toHaveBeenCalledTimes(1);
    });

    test<AdapterSuiteContext>('given 50 connect and disconnect cycles of adapters with every option, when they are done, then no hotkey, resize or document listener is left', context => {
      const addSpy = vi.spyOn(document, 'addEventListener');
      const removeSpy = vi.spyOn(document, 'removeEventListener');
      const variants: IEngineInputAdapterOptions[] = [
        {},
        {playToggle: 'k'},
        {playToggleHotkey: 'j'},
        {scope: 'engineRoot'},
        {resize: false},
        {playToggle: false},
      ];

      for (let i = 0; i < 50; i++) {
        const batch = variants.map(options =>
          createAdapter(context, options, createMockEngine())
        );
        batch.forEach(adapter => adapter.connect());
        batch.forEach(adapter => adapter.disconnect());
      }

      expect(hotkeysMocks.handlers.size).toBe(0);
      const windowAdds = vi.mocked(context.windowRef.addEventListener).mock
        .calls.length;
      const windowRemoves = vi.mocked(context.windowRef.removeEventListener)
        .mock.calls.length;
      // Every variant but resize: false listens to resizes
      expect(windowAdds).toBe(50 * 5);
      expect(windowRemoves).toBe(windowAdds);
      const documentAdds = addSpy.mock.calls.filter(
        ([type]) => type === 'pointerdown' || type === 'focusin'
      );
      const documentRemoves = removeSpy.mock.calls.filter(
        ([type]) => type === 'pointerdown' || type === 'focusin'
      );
      expect(documentAdds.length).toBeGreaterThan(0);
      expect(documentRemoves).toEqual(documentAdds);
    });
  });

  describe('hotkey handling', () => {
    test<AdapterSuiteContext>('space key should toggle play when stopped', context => {
      const {adapter, engine} = context;
      adapter.connect();

      const event = {preventDefault: vi.fn()} as unknown as KeyboardEvent;
      hotkeysMocks.trigger('space', event);

      expect(engine.start).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    test<AdapterSuiteContext>('space key should toggle play when playing', context => {
      const {adapter, engine} = context;
      (engine as any).playState = 'playing';
      adapter.connect();

      const event = {preventDefault: vi.fn()} as unknown as KeyboardEvent;
      hotkeysMocks.trigger('space', event);

      expect(engine.pause).toHaveBeenCalled();
    });

    test<AdapterSuiteContext>('space key should start when paused', context => {
      const {adapter, engine} = context;
      (engine as any).playState = 'paused';
      adapter.connect();

      const event = {preventDefault: vi.fn()} as unknown as KeyboardEvent;
      hotkeysMocks.trigger('space', event);

      expect(engine.start).toHaveBeenCalled();
    });
  });

  describe('resize handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test<AdapterSuiteContext>('should broadcast resize event after debounce', async context => {
      const {adapter, eventbus, windowRef} = context;
      adapter.connect();

      windowRef._triggerResize();
      await vi.advanceTimersByTimeAsync(200);

      expect(eventbus.broadcast).toHaveBeenCalledWith('timeline-resize', []);
    });

    test<AdapterSuiteContext>('should debounce multiple resize events', async context => {
      const {adapter, eventbus, windowRef} = context;
      adapter.connect();

      windowRef._triggerResize();
      await vi.advanceTimersByTimeAsync(100);
      windowRef._triggerResize();
      await vi.advanceTimersByTimeAsync(100);
      windowRef._triggerResize();
      await vi.advanceTimersByTimeAsync(200);

      // Should only broadcast once after the last resize + debounce time
      const resizeCalls = (eventbus.broadcast as any).mock.calls.filter(
        (call: any[]) => call[0] === 'timeline-resize'
      );
      expect(resizeCalls.length).toBe(1);
    });

    test<AdapterSuiteContext>('given resize false, when the window resizes, then no listener is registered and nothing is broadcast', async context => {
      const adapter = createAdapter(context, {resize: false});
      adapter.connect();

      context.windowRef._triggerResize();
      await vi.advanceTimersByTimeAsync(200);

      expect(context.windowRef.addEventListener).not.toHaveBeenCalled();
      expect(context.eventbus.broadcast).not.toHaveBeenCalled();
      expect(hotkeysMocks.handlers.has('space')).toBe(true);
    });
  });

  function withEngineRoot(
    context: AdapterSuiteContext,
    engine: IEligiusEngine = context.engine
  ) {
    const root = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(root, outside);
    (engine as any).engineRoot = [root];
    return {
      root,
      outside,
      cleanup: () => {
        root.remove();
        outside.remove();
      },
    };
  }

  describe('play toggle hotkey scope', () => {
    test<AdapterSuiteContext>('given focus on a button outside the engine root, when space is pressed, then playback is not toggled and the key keeps its default action', context => {
      const {cleanup, outside} = withEngineRoot(context);
      const button = document.createElement('button');
      outside.append(button);
      context.adapter.connect();
      const event = keyEvent(button);

      hotkeysMocks.trigger('space', event);

      expect(context.engine.start).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
      cleanup();
    });

    test<AdapterSuiteContext>('given focus on a button inside the engine root, when space is pressed, then the button keeps the key', context => {
      const {cleanup, root} = withEngineRoot(context);
      const button = document.createElement('button');
      root.append(button);
      context.adapter.connect();
      const event = keyEvent(button);

      hotkeysMocks.trigger('space', event);

      expect(context.engine.start).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
      cleanup();
    });

    test<AdapterSuiteContext>('given focus on an element of another part of the page, when space is pressed, then this engine does not toggle', context => {
      const {cleanup, outside} = withEngineRoot(context);
      outside.tabIndex = 0;
      context.adapter.connect();

      hotkeysMocks.trigger('space', keyEvent(outside));

      expect(context.engine.start).not.toHaveBeenCalled();
      cleanup();
    });

    test<AdapterSuiteContext>('given focus inside the engine root or nowhere, when space is pressed, then playback toggles', context => {
      const {cleanup, root} = withEngineRoot(context);
      const inner = document.createElement('div');
      root.append(inner);
      context.adapter.connect();

      hotkeysMocks.trigger('space', keyEvent(inner));
      hotkeysMocks.trigger('space', keyEvent(document.body));

      expect(context.engine.start).toHaveBeenCalledTimes(2);
      cleanup();
    });

    test<AdapterSuiteContext>('given an engine without an active timeline, when space is pressed, then the key is left alone', context => {
      (context.engine as any).duration = undefined;
      context.adapter.connect();
      const event = keyEvent(document.body);

      hotkeysMocks.trigger('space', event);

      expect(context.engine.start).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test<AdapterSuiteContext>('given playToggleHotkey false, when the adapter connects, then no hotkey is bound', context => {
      const adapter = createAdapter(context, {playToggleHotkey: false});

      adapter.connect();

      expect(hotkeysMocks.handlers.size).toBe(0);
      adapter.disconnect();
    });

    test<AdapterSuiteContext>('given playToggleHotkey k, when k is pressed, then playback toggles and disconnect unbinds it', context => {
      const adapter = createAdapter(context, {playToggleHotkey: 'k'});
      adapter.connect();

      hotkeysMocks.trigger('k', keyEvent(document.body));
      adapter.disconnect();

      expect(context.engine.start).toHaveBeenCalledTimes(1);
      expect(hotkeysMocks.handlers.has('k')).toBe(false);
    });

    test<AdapterSuiteContext>('given a connected adapter, when connect() is called again, then one resize listener is registered', context => {
      context.adapter.connect();
      context.adapter.connect();

      expect(context.windowRef.addEventListener).toHaveBeenCalledTimes(1);
    });

    test<AdapterSuiteContext>("given scope 'engineRoot', when space is pressed with nothing focused, then the key is left to the page", context => {
      const {cleanup} = withEngineRoot(context);
      const adapter = createAdapter(context, {scope: 'engineRoot'});
      adapter.connect();
      const event = keyEvent(document.body);

      hotkeysMocks.trigger('space', event);

      expect(context.engine.start).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
      cleanup();
    });

    test<AdapterSuiteContext>("given scope 'engineRoot', when space is pressed with the focus inside the engine root, then playback toggles", context => {
      const {cleanup, root} = withEngineRoot(context);
      const inner = document.createElement('div');
      inner.tabIndex = 0;
      root.append(inner);
      const adapter = createAdapter(context, {scope: 'engineRoot'});
      adapter.connect();
      const event = keyEvent(inner);

      hotkeysMocks.trigger('space', event);

      expect(context.engine.start).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
      cleanup();
    });

    test<AdapterSuiteContext>("given scope 'engineRoot', when space is pressed on a button inside the engine root, then the button keeps the key", context => {
      const {cleanup, root} = withEngineRoot(context);
      const button = document.createElement('button');
      root.append(button);
      const adapter = createAdapter(context, {scope: 'engineRoot'});
      adapter.connect();

      hotkeysMocks.trigger('space', keyEvent(button));

      expect(context.engine.start).not.toHaveBeenCalled();
      cleanup();
    });
  });

  describe('play toggle option', () => {
    test<AdapterSuiteContext>('given playToggle k, when k is pressed, then playback toggles and space is not bound', context => {
      const adapter = createAdapter(context, {playToggle: 'k'});
      adapter.connect();

      hotkeysMocks.trigger('k', keyEvent(document.body));

      expect(context.engine.start).toHaveBeenCalledTimes(1);
      expect(hotkeysMocks.handlers.has('space')).toBe(false);
    });

    test<AdapterSuiteContext>('given playToggle false, when the adapter connects, then no hotkey is bound but the resize listener is', context => {
      const adapter = createAdapter(context, {playToggle: false});

      adapter.connect();

      expect(hotkeysMocks.handlers.size).toBe(0);
      expect(context.windowRef.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    test<AdapterSuiteContext>('given playToggle and the deprecated playToggleHotkey, when the adapter connects, then playToggle wins', context => {
      const adapter = createAdapter(context, {
        playToggle: 'k',
        playToggleHotkey: 'j',
      });

      adapter.connect();

      expect(hotkeysMocks.handlers.has('k')).toBe(true);
      expect(hotkeysMocks.handlers.has('j')).toBe(false);
    });

    test<AdapterSuiteContext>('given playToggle false and the deprecated playToggleHotkey, when the adapter connects, then no hotkey is bound', context => {
      const adapter = createAdapter(context, {
        playToggle: false,
        playToggleHotkey: 'j',
      });

      adapter.connect();

      expect(hotkeysMocks.handlers.size).toBe(0);
    });

    test<AdapterSuiteContext>('given a hotkey with two shortcuts, when either is pressed, then playback toggles', context => {
      const adapter = createAdapter(context, {playToggle: 'k, P'});
      adapter.connect();

      hotkeysMocks.trigger('k', keyEvent(document.body));
      hotkeysMocks.trigger('P', keyEvent(document.body));

      expect(context.engine.start).toHaveBeenCalledTimes(2);
    });
  });

  describe('several engines on one page', () => {
    function twoEngines(context: AdapterSuiteContext) {
      const first = withEngineRoot(context);
      const otherEngine = createMockEngine();
      const second = withEngineRoot(context, otherEngine);
      context.adapter.connect();
      const otherAdapter = createAdapter(context, undefined, otherEngine);
      otherAdapter.connect();
      return {
        first,
        second,
        otherEngine,
        otherAdapter,
        cleanup: () => {
          first.cleanup();
          second.cleanup();
        },
      };
    }

    test<AdapterSuiteContext>('given two engines and nothing focused or clicked, when space is pressed, then only the first connected engine toggles', context => {
      const {otherEngine, cleanup} = twoEngines(context);
      const event = keyEvent(document.body);

      hotkeysMocks.trigger('space', event);

      expect(context.engine.start).toHaveBeenCalledTimes(1);
      expect(otherEngine.start).not.toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      cleanup();
    });

    test<AdapterSuiteContext>('given two engines and a click inside the second engine root, when space is pressed with nothing focused, then only the second engine toggles', context => {
      const {second, otherEngine, cleanup} = twoEngines(context);
      second.root.dispatchEvent(new Event('pointerdown', {bubbles: true}));

      hotkeysMocks.trigger('space', keyEvent(document.body));

      expect(otherEngine.start).toHaveBeenCalledTimes(1);
      expect(context.engine.start).not.toHaveBeenCalled();
      cleanup();
    });

    test<AdapterSuiteContext>('given two engines and the focus inside the second engine root, when space is pressed, then only the second engine toggles', context => {
      const {second, otherEngine, cleanup} = twoEngines(context);
      const inner = document.createElement('div');
      inner.tabIndex = 0;
      second.root.append(inner);
      inner.focus();

      hotkeysMocks.trigger('space', keyEvent(inner));

      expect(otherEngine.start).toHaveBeenCalledTimes(1);
      expect(context.engine.start).not.toHaveBeenCalled();
      cleanup();
    });

    test<AdapterSuiteContext>('given the last clicked engine is disconnected, when space is pressed with nothing focused, then the remaining engine toggles', context => {
      const {second, otherEngine, otherAdapter, cleanup} = twoEngines(context);
      second.root.dispatchEvent(new Event('pointerdown', {bubbles: true}));

      otherAdapter.disconnect();
      hotkeysMocks.trigger('space', keyEvent(document.body));

      expect(context.engine.start).toHaveBeenCalledTimes(1);
      expect(otherEngine.start).not.toHaveBeenCalled();
      cleanup();
    });

    test<AdapterSuiteContext>('given the last clicked engine has no active timeline, when space is pressed with nothing focused, then the other engine toggles', context => {
      const {second, otherEngine, cleanup} = twoEngines(context);
      second.root.dispatchEvent(new Event('pointerdown', {bubbles: true}));
      (otherEngine as any).duration = undefined;

      hotkeysMocks.trigger('space', keyEvent(document.body));

      expect(context.engine.start).toHaveBeenCalledTimes(1);
      expect(otherEngine.start).not.toHaveBeenCalled();
      cleanup();
    });

    test<AdapterSuiteContext>('given two engines on different keys, when the second key is pressed with nothing focused, then the engine bound to it toggles', context => {
      withEngineRoot(context);
      const otherEngine = createMockEngine();
      context.adapter.connect();
      createAdapter(context, {playToggle: 'k'}, otherEngine).connect();

      hotkeysMocks.trigger('k', keyEvent(document.body));

      expect(otherEngine.start).toHaveBeenCalledTimes(1);
      expect(context.engine.start).not.toHaveBeenCalled();
    });

    test<AdapterSuiteContext>("given a default engine and an 'engineRoot' scoped engine, when space is pressed with nothing focused, then only the default engine toggles", context => {
      const {cleanup} = withEngineRoot(context);
      const otherEngine = createMockEngine();
      createAdapter(context, {scope: 'engineRoot'}, otherEngine).connect();
      context.adapter.connect();

      hotkeysMocks.trigger('space', keyEvent(document.body));

      expect(context.engine.start).toHaveBeenCalledTimes(1);
      expect(otherEngine.start).not.toHaveBeenCalled();
      cleanup();
    });
  });
});
