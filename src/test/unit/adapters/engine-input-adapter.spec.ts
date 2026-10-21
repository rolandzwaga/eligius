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
import {EngineInputAdapter} from '../../../adapters/engine-input-adapter.ts';
import type {IEligiusEngine} from '../../../types.ts';
import {createMockEventbus} from '../../fixtures/eventbus-factory.ts';

// Use vi.hoisted() to share mock state between vi.mock() and tests
// See specs/TESTING-GUIDE.md "Advanced: vi.hoisted() Pattern"
const hotkeysMocks = vi.hoisted(() => {
  const handlers = new Map<string, (...args: any[]) => void>();
  // Like hotkeys-js, bindings without an explicit scope live in 'all', and an
  // unbind without an explicit scope only matches the *current* scope.
  const scopes = new Map<string, string>();
  const state = {currentScope: 'all'};

  const resetHandlers = () => {
    handlers.clear();
    scopes.clear();
    state.currentScope = 'all';
  };

  const trigger = (key: string, event: KeyboardEvent) => {
    const handler = handlers.get(key);
    if (handler) {
      handler(event, {key});
    }
  };

  return {
    handlers,
    scopes,
    state,
    resetHandlers,
    trigger,
  };
});

// Mock hotkeys-js using the hoisted state
vi.mock('hotkeys-js', () => {
  return {
    default: Object.assign(
      (key: string, handler: (...args: any[]) => void) => {
        hotkeysMocks.handlers.set(key, handler);
        hotkeysMocks.scopes.set(key, 'all');
      },
      {
        unbind: (key: string, scopeOrMethod?: unknown) => {
          const scope =
            typeof scopeOrMethod === 'string'
              ? scopeOrMethod
              : hotkeysMocks.state.currentScope;
          if (hotkeysMocks.scopes.get(key) === scope) {
            hotkeysMocks.handlers.delete(key);
            hotkeysMocks.scopes.delete(key);
          }
        },
        setScope: (scope: string) => {
          hotkeysMocks.state.currentScope = scope;
        },
      }
    ),
  };
});

type AdapterSuiteContext = {
  engine: IEligiusEngine;
  eventbus: IEventbus;
  windowRef: Window & {_triggerResize: () => void};
  adapter: EngineInputAdapter;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

describe<AdapterSuiteContext>('EngineInputAdapter', () => {
  beforeEach(context => {
    withContext<AdapterSuiteContext>(context);
    hotkeysMocks.resetHandlers();

    // Create mock engine
    context.engine = {
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

    context.adapter = new EngineInputAdapter(
      context.engine,
      context.eventbus,
      context.windowRef
    );
  });

  describe('constructor', () => {
    test<AdapterSuiteContext>('should create an instance', context => {
      expect(context.adapter).toBeDefined();
    });
  });

  describe('connect()', () => {
    test<AdapterSuiteContext>('should register space hotkey', context => {
      const {adapter} = context;

      adapter.connect();

      expect(hotkeysMocks.handlers.has('space')).toBe(true);
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
  });
  describe('play toggle hotkey scope', () => {
    function keyEvent(target: EventTarget) {
      return {target, preventDefault: vi.fn()} as unknown as KeyboardEvent;
    }

    function withEngineRoot(context: AdapterSuiteContext) {
      const root = document.createElement('div');
      const outside = document.createElement('div');
      document.body.append(root, outside);
      (context.engine as any).engineRoot = [root];
      return {
        root,
        outside,
        cleanup: () => {
          root.remove();
          outside.remove();
        },
      };
    }

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
      const adapter = new EngineInputAdapter(
        context.engine,
        context.eventbus,
        context.windowRef,
        {playToggleHotkey: false}
      );

      adapter.connect();

      expect(hotkeysMocks.handlers.size).toBe(0);
      adapter.disconnect();
    });

    test<AdapterSuiteContext>('given playToggleHotkey k, when k is pressed, then playback toggles and disconnect unbinds it', context => {
      const adapter = new EngineInputAdapter(
        context.engine,
        context.eventbus,
        context.windowRef,
        {playToggleHotkey: 'k'}
      );
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
  });
});
