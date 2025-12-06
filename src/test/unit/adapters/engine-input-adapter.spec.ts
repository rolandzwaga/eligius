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

  const resetHandlers = () => {
    handlers.clear();
  };

  const trigger = (key: string, event: KeyboardEvent) => {
    const handler = handlers.get(key);
    if (handler) {
      handler(event, {key});
    }
  };

  return {
    handlers,
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
      },
      {
        unbind: (key: string) => {
          hotkeysMocks.handlers.delete(key);
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
});
