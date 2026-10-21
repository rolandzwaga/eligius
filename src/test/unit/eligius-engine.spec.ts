import {EndableAction, TimelineAction} from '@action/index.ts';
import {EngineEventbusAdapter} from '@adapters/engine-eventbus-adapter.ts';
import type {IEventbus} from '@eventbus/types.ts';
import type {ILocaleManager} from '@locale/types.ts';
import {attachControllerToElement} from '@operation/helper/attach-controller-to-element.ts';
import {removeControllerFromElement} from '@operation/remove-controller-from-element.ts';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.ts';
import type {
  IContainerProvider,
  IPositionSource,
  ISeekable,
  TSourceState,
} from '@timelineproviders/types.ts';
import $ from 'jquery';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type Mock,
  test,
  vi,
} from 'vitest';
import {EligiusEngine, EngineActionError} from '@/eligius-engine.ts';
import type {ITimelineProviderInfo} from '@/types.ts';

interface EligiusEngineSuiteContext {
  engine: EligiusEngine;
  adapter: EngineEventbusAdapter;
  configuration: any;
  eventbus: IEventbus;
  providers: any;
  localeManager: ILocaleManager;
  mockPositionSource: IPositionSource & ISeekable;
  mockContainerProvider: IContainerProvider;
}

/**
 * Creates a mock position source with proper state management.
 * The mock automatically transitions state on activate/suspend/deactivate calls,
 * avoiding manual state manipulation in tests.
 */
function createMockPositionSource(
  overrides: Partial<IPositionSource & ISeekable> = {}
): IPositionSource & ISeekable {
  // Use an object to hold mutable state so closures can update it
  const stateHolder = {current: 'inactive' as TSourceState};

  const mock: IPositionSource & ISeekable = {
    get state() {
      return stateHolder.current;
    },
    set state(value: TSourceState) {
      stateHolder.current = value;
    },
    loop: false,
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    activate: vi.fn().mockImplementation(async () => {
      stateHolder.current = 'active';
    }),
    suspend: vi.fn().mockImplementation(() => {
      stateHolder.current = 'suspended';
    }),
    deactivate: vi.fn().mockImplementation(() => {
      stateHolder.current = 'inactive';
    }),
    getPosition: vi.fn().mockReturnValue(0),
    getDuration: vi.fn().mockReturnValue(10), // 10 seconds default duration
    onPosition: vi.fn(),
    onBoundaryReached: vi.fn(),
    onActivated: vi.fn(),
    seek: vi.fn().mockResolvedValue(0),
    ...overrides,
  };

  return mock;
}

/**
 * A mock timeline action whose `active` flag follows start()/end(), like
 * TimelineAction does.
 */
function createStatefulMockAction(start: number, end: number) {
  const action = {
    id: `action-${start}-${end}`,
    duration: {start, end},
    active: false,
    start: vi.fn(() => {
      action.active = true;
      return Promise.resolve({});
    }),
    end: vi.fn(() => {
      action.active = false;
      return Promise.resolve({});
    }),
  };
  return action;
}

function createMockContainerProvider(
  overrides: Partial<IContainerProvider> = {}
): IContainerProvider {
  return {
    getContainer: vi.fn().mockReturnValue($('<div/>')),
    onContainerReady: vi.fn(),
    ...overrides,
  };
}

/**
 * Extracts the callback registered with a mock function.
 * More robust than directly accessing .mock.calls[0][0] as it:
 * 1. Provides clear error message if no callback was registered
 * 2. Centralizes the pattern for easier maintenance
 *
 * @param mockFn - The mock function that was called with a callback
 * @param description - Description for error messages (e.g., 'onPosition')
 * @returns The callback function that was passed to the mock
 */
function getRegisteredCallback<T extends (...args: any[]) => any>(
  mockFn: Mock,
  description: string
): T {
  const calls = mockFn.mock.calls;
  if (calls.length === 0) {
    throw new Error(`No ${description} callback was registered`);
  }
  const callback = calls[calls.length - 1][0]; // Get most recent callback
  if (typeof callback !== 'function') {
    throw new Error(`${description} was not called with a function callback`);
  }
  return callback as T;
}

function createMinimalConfiguration(overrides: Partial<any> = {}) {
  return {
    containerSelector: '.test-container',
    layoutTemplate: '<div class="layout"><div class="content"></div></div>',
    initActions: [],
    timelines: [
      {
        type: 'animation',
        uri: 'timeline-1',
        duration: 10, // 10 seconds
        selector: '.content',
        loop: false,
        timelineActions: [],
      },
    ],
    ...overrides,
  };
}

/**
 * Creates a mock playlist for testing timeline switching.
 * Reduces repeated setup code across tests.
 *
 * @param items - Array of timeline URIs (defaults to ['timeline-1', 'timeline-2'])
 * @param currentUri - Current timeline URI (defaults to first item)
 */
function createMockPlaylist(
  items: string[] = ['timeline-1', 'timeline-2'],
  currentUri?: string
) {
  return {
    currentItem: {uri: currentUri ?? items[0]},
    items: items.map(uri => ({uri})),
    selectItem: vi.fn(),
    onItemChange: vi.fn(),
  };
}

/**
 * (Re)creates `context.engine` from the context's configuration and providers
 * and connects an EngineEventbusAdapter to it, as EngineFactory does. The
 * adapter owns the eventbus commands and state broadcasts, so the
 * 'eventbus:' tests below exercise the engine through it.
 */
function rebuildEngine(context: EligiusEngineSuiteContext) {
  context.adapter?.disconnect();
  context.engine = new EligiusEngine(
    context.configuration,
    context.eventbus,
    context.providers,
    context.localeManager
  );
  context.adapter = new EngineEventbusAdapter(context.engine, context.eventbus);
  context.adapter.connect();
}

describe('EligiusEngine', () => {
  beforeEach<EligiusEngineSuiteContext>(context => {
    context.adapter = undefined as unknown as EngineEventbusAdapter;
    // Setup DOM
    $('<div class="test-container"/>').appendTo(document.body);

    // Setup mocks
    context.mockPositionSource = createMockPositionSource();
    context.mockContainerProvider = createMockContainerProvider();
    context.eventbus = createMockEventbus();
    context.localeManager = {
      destroy: vi.fn(),
    } as unknown as ILocaleManager;
    context.providers = {
      animation: {
        id: 'animation-provider',
        positionSource: context.mockPositionSource,
        containerProvider: context.mockContainerProvider,
      } as ITimelineProviderInfo,
    };
    context.configuration = createMinimalConfiguration();

    rebuildEngine(context);
  });

  afterEach<EligiusEngineSuiteContext>(context => {
    context.adapter?.disconnect();
    $('.test-container').remove();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    test<EligiusEngineSuiteContext>('should create an engine instance', context => {
      expect(context.engine).toBeDefined();
    });
  });

  describe('state properties', () => {
    test<EligiusEngineSuiteContext>('position should return current provider position without flooring', async context => {
      await context.engine.init();
      (context.mockPositionSource.getPosition as Mock).mockReturnValue(5.7);

      expect(context.engine.position).toBe(5.7);
    });

    test<EligiusEngineSuiteContext>('position should preserve fractional values', async context => {
      await context.engine.init();
      (context.mockPositionSource.getPosition as Mock).mockReturnValue(12.3);

      expect(context.engine.position).toBe(12.3);
    });

    test<EligiusEngineSuiteContext>('position should return 0 when no provider', context => {
      expect(context.engine.position).toBe(0);
    });

    test<EligiusEngineSuiteContext>('duration should return provider duration', async context => {
      await context.engine.init();
      (context.mockPositionSource.getDuration as Mock).mockReturnValue(60);

      expect(context.engine.duration).toBe(60);
    });

    test<EligiusEngineSuiteContext>('duration should return undefined when no provider', context => {
      expect(context.engine.duration).toBeUndefined();
    });

    test<EligiusEngineSuiteContext>('playState should initially be stopped', context => {
      expect(context.engine.playState).toBe('stopped');
    });

    test<EligiusEngineSuiteContext>('currentTimelineUri should return current timeline URI', async context => {
      await context.engine.init();

      expect(context.engine.currentTimelineUri).toBe('timeline-1');
    });

    test<EligiusEngineSuiteContext>('container should return provider container', async context => {
      const mockContainer = $('<div class="mock-container"/>');
      (context.mockContainerProvider.getContainer as Mock).mockReturnValue(
        mockContainer
      );
      await context.engine.init();

      expect(context.engine.container).toBe(mockContainer);
    });

    test<EligiusEngineSuiteContext>('engineRoot should return container element', async context => {
      await context.engine.init();

      expect(context.engine.engineRoot.hasClass('test-container')).toBe(true);
    });
  });

  describe('on() - event subscription', () => {
    test<EligiusEngineSuiteContext>('should subscribe to start event', async context => {
      const handler = vi.fn();
      await context.engine.init();

      context.engine.on('start', handler);
      await context.engine.start();

      expect(handler).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should return unsubscribe function', async context => {
      const handler = vi.fn();
      await context.engine.init();

      const unsubscribe = context.engine.on('start', handler);
      unsubscribe();
      await context.engine.start();

      expect(handler).not.toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should emit time event with fractional position', async context => {
      const handler = vi.fn();
      await context.engine.init();

      context.engine.on('time', handler);
      // Simulate onPosition callback from provider
      const onPosition = getRegisteredCallback<(position: number) => void>(
        context.mockPositionSource.onPosition as Mock,
        'onPosition'
      );
      onPosition(5.5);

      expect(handler).toHaveBeenCalledWith(5.5);
    });

    test<EligiusEngineSuiteContext>('should emit time event preserving decimal precision', async context => {
      const handler = vi.fn();
      await context.engine.init();

      context.engine.on('time', handler);
      const onPosition = getRegisteredCallback<(position: number) => void>(
        context.mockPositionSource.onPosition as Mock,
        'onPosition'
      );
      onPosition(12.7);

      expect(handler).toHaveBeenCalledWith(12.7);
    });

    test<EligiusEngineSuiteContext>('should emit initialized event after init', async context => {
      const handler = vi.fn();
      context.engine.on('initialized', handler);

      await context.engine.init();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('start()', () => {
    test<EligiusEngineSuiteContext>('should activate position source and set playState to playing', async context => {
      await context.engine.init();
      // Mock now automatically transitions state to 'active' on activate()

      await context.engine.start();

      expect(context.mockPositionSource.activate).toHaveBeenCalled();
      expect(context.engine.playState).toBe('playing');
    });

    test<EligiusEngineSuiteContext>('should emit start event', async context => {
      const handler = vi.fn();
      await context.engine.init();
      context.engine.on('start', handler);

      await context.engine.start();

      expect(handler).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should do nothing when no provider', async context => {
      await context.engine.start();
      // Should not throw
    });
  });

  describe('pause()', () => {
    test<EligiusEngineSuiteContext>('should suspend position source and set playState to paused', async context => {
      await context.engine.init();
      // Mock now automatically transitions state to 'suspended' on suspend()
      await context.engine.start();

      context.engine.pause();

      expect(context.mockPositionSource.suspend).toHaveBeenCalled();
      expect(context.engine.playState).toBe('paused');
    });

    test<EligiusEngineSuiteContext>('should emit pause event', async context => {
      const handler = vi.fn();
      await context.engine.init();
      context.engine.on('pause', handler);

      context.engine.pause();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    test<EligiusEngineSuiteContext>('should deactivate position source and set playState to stopped', async context => {
      await context.engine.init();
      // Mock now automatically transitions state to 'inactive' on deactivate()
      await context.engine.start();

      context.engine.stop();

      expect(context.mockPositionSource.deactivate).toHaveBeenCalled();
      expect(context.engine.playState).toBe('stopped');
    });

    test<EligiusEngineSuiteContext>('should emit stop event', async context => {
      const handler = vi.fn();
      await context.engine.init();
      context.engine.on('stop', handler);

      context.engine.stop();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('seek()', () => {
    test<EligiusEngineSuiteContext>('should seek to position and return final position', async context => {
      await context.engine.init();
      (context.mockPositionSource.getDuration as Mock).mockReturnValue(100);
      (context.mockPositionSource.getPosition as Mock).mockReturnValue(50);

      const result = await context.engine.seek(50);

      expect(context.mockPositionSource.seek).toHaveBeenCalledWith(50);
      expect(result).toBe(50);
    });

    test<EligiusEngineSuiteContext>('should emit seekStart and seekComplete events', async context => {
      const seekStartHandler = vi.fn();
      const seekCompleteHandler = vi.fn();
      await context.engine.init();
      (context.mockPositionSource.getDuration as Mock).mockReturnValue(100);
      (context.mockPositionSource.getPosition as Mock).mockReturnValue(25);
      context.engine.on('seekStart', seekStartHandler);
      context.engine.on('seekComplete', seekCompleteHandler);

      await context.engine.seek(50);

      expect(seekStartHandler).toHaveBeenCalledWith(50, 25, 100);
      expect(seekCompleteHandler).toHaveBeenCalledWith(25, 100);
    });

    test<EligiusEngineSuiteContext>('should return current position when out of bounds', async context => {
      await context.engine.init();
      (context.mockPositionSource.getDuration as Mock).mockReturnValue(100);
      (context.mockPositionSource.getPosition as Mock).mockReturnValue(25);

      const result = await context.engine.seek(150);

      expect(result).toBe(25);
      expect(context.mockPositionSource.seek).not.toHaveBeenCalled();
    });
  });

  describe('switchTimeline()', () => {
    test<EligiusEngineSuiteContext>('should emit timelineChange event', async context => {
      context.configuration.timelines.push({
        type: 'animation',
        uri: 'timeline-2',
        duration: 20,
        selector: '.content',
        loop: false,
        timelineActions: [],
      });
      const handler = vi.fn();
      await context.engine.init();
      context.engine.on('timelineChange', handler);

      await context.engine.switchTimeline('timeline-2');

      expect(handler).toHaveBeenCalledWith('timeline-2');
    });

    test<EligiusEngineSuiteContext>('should not switch to same timeline', async context => {
      const handler = vi.fn();
      await context.engine.init();
      context.engine.on('timelineChange', handler);

      await context.engine.switchTimeline('timeline-1');

      expect(handler).not.toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should re-activate the position source on the new timeline', async context => {
      // Regression: switchTimeline deactivates the source at the top but must turn
      // it back on, otherwise the switched-to timeline produces no first frame —
      // it runs none of its start actions and never advances (blank + frozen).
      context.configuration.timelines.push({
        type: 'animation',
        uri: 'timeline-2',
        duration: 20,
        selector: '.content',
        loop: false,
        timelineActions: [],
      });
      await context.engine.init();
      (context.mockPositionSource.activate as Mock).mockClear();

      await context.engine.switchTimeline('timeline-2');

      expect(context.mockPositionSource.activate).toHaveBeenCalled();
      expect(context.mockPositionSource.state).toBe('active');
    });

    test<EligiusEngineSuiteContext>('should run the new timeline position-0 actions on switch (end-to-end)', async context => {
      // Use a source that emits position 0 on activate (like RafPositionSource) so
      // we exercise the real _onTimeHandler → position-lookup path the fix relies on:
      // after switch the new timeline's first frame must run its start actions.
      let positionCb: ((p: number) => void) | undefined;
      let state: TSourceState = 'inactive';
      const source: IPositionSource & ISeekable = {
        get state() {
          return state;
        },
        set state(v) {
          state = v;
        },
        loop: false,
        init: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        activate: vi.fn().mockImplementation(async () => {
          state = 'active';
          positionCb?.(0);
        }),
        suspend: vi.fn().mockImplementation(() => {
          state = 'suspended';
        }),
        deactivate: vi.fn().mockImplementation(() => {
          state = 'inactive';
        }),
        getPosition: vi.fn().mockReturnValue(0),
        getDuration: vi.fn().mockReturnValue(10),
        onPosition: vi.fn((cb: (p: number) => void) => {
          positionCb = cb;
        }),
        onBoundaryReached: vi.fn(),
        onActivated: vi.fn(),
        seek: vi.fn().mockResolvedValue(0),
      };

      const action2Start = vi.fn().mockResolvedValue(undefined);
      const configuration: any = createMinimalConfiguration({
        timelines: [
          {
            type: 'animation',
            uri: 'timeline-1',
            duration: 10,
            selector: '.content',
            loop: false,
            timelineActions: [],
          },
          {
            type: 'animation',
            uri: 'timeline-2',
            duration: 10,
            selector: '.content',
            loop: false,
            timelineActions: [
              {
                id: 't2a',
                duration: {start: 0, end: 10},
                start: action2Start,
                end: vi.fn().mockResolvedValue(undefined),
              },
            ],
          },
        ],
      });

      const providers: any = {
        animation: {
          id: 'animation',
          positionSource: source,
          containerProvider: context.mockContainerProvider,
        } as ITimelineProviderInfo,
      };
      const engine = new EligiusEngine(
        configuration,
        createMockEventbus(),
        providers,
        {destroy: vi.fn()} as unknown as ILocaleManager
      );

      await engine.init();
      await engine.start(); // activate timeline-1 (no actions)
      action2Start.mockClear();

      await engine.switchTimeline('timeline-2');

      expect(action2Start).toHaveBeenCalled();
    });
  });

  describe('init()', () => {
    test<EligiusEngineSuiteContext>('should create layout template in container', async context => {
      await context.engine.init();

      expect($('.test-container .layout').length).toBe(1);
      expect($('.test-container .content').length).toBe(1);
    });

    test<EligiusEngineSuiteContext>('should throw error when container selector not found', context => {
      context.configuration.containerSelector = '.nonexistent';
      const engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.localeManager
      );

      // init() throws synchronously when container not found
      expect(() => engine.init()).toThrow(
        'Container selector not found: .nonexistent'
      );
    });

    test<EligiusEngineSuiteContext>('should warn when layoutTemplate is empty', async context => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      context.configuration.layoutTemplate = '';

      await context.engine.init();

      expect(warnSpy).toHaveBeenCalledWith(
        'layoutTemplate is empty, unable to create layout'
      );
    });

    test<EligiusEngineSuiteContext>('should throw error when no timelines configured', async context => {
      context.configuration.timelines = null;
      const engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.localeManager
      );

      await expect(engine.init()).rejects.toThrow('No timelines present');
    });

    test<EligiusEngineSuiteContext>('should throw error when no provider for timeline type', async context => {
      context.providers = {}; // No providers
      const engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.localeManager
      );

      await expect(engine.init()).rejects.toThrow(
        'No timeline provider configured for type animation'
      );
    });

    test<EligiusEngineSuiteContext>('should initialize the position source', async context => {
      await context.engine.init();

      expect(context.mockPositionSource.init).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should register onPosition callback with provider', async context => {
      await context.engine.init();

      expect(context.mockPositionSource.onPosition).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test<EligiusEngineSuiteContext>('should register onBoundaryReached callback with provider', async context => {
      await context.engine.init();

      expect(context.mockPositionSource.onBoundaryReached).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test<EligiusEngineSuiteContext>('should register onActivated callback with provider', async context => {
      await context.engine.init();

      expect(context.mockPositionSource.onActivated).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test<EligiusEngineSuiteContext>('should execute initActions on start', async context => {
      const initAction = {
        start: vi.fn().mockResolvedValue({}),
        end: vi.fn().mockResolvedValue({}),
      };
      context.configuration.initActions = [initAction];

      await context.engine.init();

      expect(initAction.start).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should return the position source', async context => {
      const result = await context.engine.init();

      expect(result).toBe(context.mockPositionSource);
    });

    test<EligiusEngineSuiteContext>('should register only the callback-style query listeners, leaving commands to EngineEventbusAdapter', async context => {
      const eventbus = createMockEventbus();
      const engine = new EligiusEngine(
        context.configuration,
        eventbus,
        context.providers,
        context.localeManager
      );

      await engine.init();

      const registered = (eventbus.on as Mock).mock.calls.map(call => call[0]);
      expect(registered).toEqual(
        expect.arrayContaining([
          'request-engine-root',
          'request-current-timeline-position',
          'request-timeline-cleanup',
          'timeline-request-current-timeline',
          'timeline-container-request',
          'timeline-duration-request',
        ])
      );
      expect(registered).not.toContain('timeline-play-request');
      expect(registered).not.toContain('timeline-pause-request');
      expect(registered).not.toContain('timeline-stop-request');
      expect(registered).not.toContain('timeline-seek-request');
      expect(registered).not.toContain('timeline-play-toggle-request');
      expect(registered).not.toContain('request-timeline-uri');
    });
  });

  describe('destroy()', () => {
    test<EligiusEngineSuiteContext>('should empty the container', async context => {
      await context.engine.init();
      expect($('.test-container').children().length).toBeGreaterThan(0);

      await context.engine.destroy();

      expect($('.test-container').children().length).toBe(0);
    });

    test<EligiusEngineSuiteContext>('should destroy the language manager', async context => {
      await context.engine.init();

      await context.engine.destroy();

      expect(context.localeManager.destroy).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should destroy all position sources', async context => {
      await context.engine.init();

      await context.engine.destroy();

      expect(context.mockPositionSource.destroy).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should execute initActions end methods in reverse order', async context => {
      const callOrder: string[] = [];
      const initAction1 = {
        start: vi.fn().mockResolvedValue({}),
        end: vi.fn().mockImplementation(() => {
          callOrder.push('action1');
          return Promise.resolve({});
        }),
      };
      const initAction2 = {
        start: vi.fn().mockResolvedValue({}),
        end: vi.fn().mockImplementation(() => {
          callOrder.push('action2');
          return Promise.resolve({});
        }),
      };
      context.configuration.initActions = [initAction1, initAction2];

      await context.engine.init();
      await context.engine.destroy();

      expect(initAction1.end).toHaveBeenCalled();
      expect(initAction2.end).toHaveBeenCalled();
      // Reverse order: action2 should be called before action1
      expect(callOrder).toEqual(['action2', 'action1']);
    });
  });

  describe('eventbus: timeline-play-request', () => {
    test<EligiusEngineSuiteContext>('should activate the position source', async context => {
      await context.engine.init();

      context.eventbus.broadcast('timeline-play-request', []);

      // Use vi.waitFor for robust async handling - avoids flaky tests
      // when async handlers do more work than a single Promise.resolve
      await vi.waitFor(() => {
        expect(context.mockPositionSource.activate).toHaveBeenCalled();
      });
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-play event', async context => {
      await context.engine.init();

      context.eventbus.broadcast('timeline-play-request', []);

      // Use vi.waitFor for robust async handling
      await vi.waitFor(() => {
        expect(context.eventbus.broadcast).toHaveBeenCalledWith(
          'timeline-play',
          []
        );
      });
    });
  });

  describe('eventbus: timeline-pause-request', () => {
    test<EligiusEngineSuiteContext>('should suspend the position source', async context => {
      await context.engine.init();

      context.eventbus.broadcast('timeline-pause-request', []);

      expect(context.mockPositionSource.suspend).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-pause event', async context => {
      await context.engine.init();

      context.eventbus.broadcast('timeline-pause-request', []);

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-pause',
        []
      );
    });
  });

  describe('eventbus: timeline-stop-request', () => {
    test<EligiusEngineSuiteContext>('should deactivate the position source', async context => {
      await context.engine.init();

      context.eventbus.broadcast('timeline-stop-request', []);

      expect(context.mockPositionSource.deactivate).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-stop event', async context => {
      await context.engine.init();

      context.eventbus.broadcast('timeline-stop-request', []);

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-stop',
        []
      );
    });
  });

  describe('eventbus: timeline-play-toggle-request', () => {
    test<EligiusEngineSuiteContext>('should pause when currently active', async context => {
      await context.engine.init();
      // Start the engine to set state to 'active'
      await context.engine.start();

      context.eventbus.broadcast('timeline-play-toggle-request', []);

      expect(context.mockPositionSource.suspend).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should start when currently inactive', async context => {
      await context.engine.init();
      // State is 'inactive' by default after init (not started yet)

      context.eventbus.broadcast('timeline-play-toggle-request', []);

      // Use vi.waitFor for robust async handling
      await vi.waitFor(() => {
        expect(context.mockPositionSource.activate).toHaveBeenCalled();
      });
    });
  });

  describe('eventbus: timeline-seek-request', () => {
    test<EligiusEngineSuiteContext>('should seek to the requested position', async context => {
      await context.engine.init();
      (context.mockPositionSource.getDuration as Mock).mockReturnValue(100);

      context.eventbus.broadcast('timeline-seek-request', [50]);

      expect(context.mockPositionSource.seek).toHaveBeenCalledWith(50);
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-seek event before seeking', async context => {
      await context.engine.init();
      (context.mockPositionSource.getDuration as Mock).mockReturnValue(100);
      (context.mockPositionSource.getPosition as Mock).mockReturnValue(25);

      context.eventbus.broadcast('timeline-seek-request', [50]);

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-seek',
        [50, 25, 100]
      );
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-seeked event after seeking', async context => {
      await context.engine.init();
      (context.mockPositionSource.getDuration as Mock).mockReturnValue(100);
      (context.mockPositionSource.getPosition as Mock).mockReturnValue(50);

      context.eventbus.broadcast('timeline-seek-request', [50]);

      // Need to wait for async seek to complete
      await vi.waitFor(() => {
        expect(context.eventbus.broadcast).toHaveBeenCalledWith(
          'timeline-seeked',
          [50, 100]
        );
      });
    });

    test<EligiusEngineSuiteContext>('should not seek when position is below 0', async context => {
      await context.engine.init();

      context.eventbus.broadcast('timeline-seek-request', [-5]);

      expect(context.mockPositionSource.seek).not.toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should not seek when position is above duration', async context => {
      await context.engine.init();
      (context.mockPositionSource.getDuration as Mock).mockReturnValue(100);

      context.eventbus.broadcast('timeline-seek-request', [150]);

      expect(context.mockPositionSource.seek).not.toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should preserve fractional seek position', async context => {
      await context.engine.init();
      (context.mockPositionSource.getDuration as Mock).mockReturnValue(100);

      context.eventbus.broadcast('timeline-seek-request', [50.7]);

      expect(context.mockPositionSource.seek).toHaveBeenCalledWith(50.7);
    });
  });

  describe('eventbus: request-engine-root', () => {
    test<EligiusEngineSuiteContext>('should call callback with container element', async context => {
      await context.engine.init();
      const callback = vi.fn();

      context.eventbus.broadcast('request-engine-root', [callback]);

      expect(callback).toHaveBeenCalled();
      const result = callback.mock.calls[0][0];
      expect(result.is('.test-container')).toBe(true);
    });
  });

  describe('eventbus: timeline-container-request', () => {
    test<EligiusEngineSuiteContext>('should call callback with provider container', async context => {
      await context.engine.init();
      const mockContainer = $('<div class="provider-container"/>');
      (context.mockContainerProvider.getContainer as Mock).mockReturnValue(
        mockContainer
      );
      const callback = vi.fn();

      context.eventbus.broadcast('timeline-container-request', [callback]);

      expect(callback).toHaveBeenCalledWith(mockContainer);
    });
  });

  describe('eventbus: timeline-duration-request', () => {
    test<EligiusEngineSuiteContext>('should call callback with duration', async context => {
      await context.engine.init();
      (context.mockPositionSource.getDuration as Mock).mockReturnValue(60);
      const callback = vi.fn();

      context.eventbus.broadcast('timeline-duration-request', [callback]);

      expect(callback).toHaveBeenCalledWith(60);
    });
  });

  describe('eventbus: request-current-timeline-position', () => {
    test<EligiusEngineSuiteContext>('should call callback with fractional position', async context => {
      await context.engine.init();
      (context.mockPositionSource.getPosition as Mock).mockReturnValue(5.7);
      const callback = vi.fn();

      context.eventbus.broadcast('request-current-timeline-position', [
        callback,
      ]);

      expect(callback).toHaveBeenCalledWith(5.7);
    });

    test<EligiusEngineSuiteContext>('should return -1 when no active provider', async context => {
      // Don't initialize, so no active provider
      // But we need eventbus listeners, so manually set up a minimal scenario
      context.configuration.timelines = [];
      const engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.localeManager
      );

      // The engine won't have an active provider if init fails
      // We need to test when provider is undefined
      const callback = vi.fn();
      // This will fail because no timelines, but listeners are added before that check
      try {
        await engine.init();
      } catch {
        // Expected
      }

      context.eventbus.broadcast('request-current-timeline-position', [
        callback,
      ]);

      expect(callback).toHaveBeenCalledWith(-1);
    });
  });

  describe('eventbus: timeline-request-current-timeline', () => {
    test<EligiusEngineSuiteContext>('should call callback with current timeline URI', async context => {
      await context.engine.init();
      const callback = vi.fn();

      context.eventbus.broadcast('timeline-request-current-timeline', [
        callback,
      ]);

      expect(callback).toHaveBeenCalledWith('timeline-1');
    });
  });

  describe('position source callbacks', () => {
    test<EligiusEngineSuiteContext>('should broadcast timeline-complete when onBoundaryReached fires with end', async context => {
      await context.engine.init();

      const onBoundaryReached = getRegisteredCallback<
        (boundary: string) => void
      >(
        context.mockPositionSource.onBoundaryReached as Mock,
        'onBoundaryReached'
      );

      onBoundaryReached('end');

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-complete',
        []
      );
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-restart when onBoundaryReached fires with start', async context => {
      await context.engine.init();

      const onBoundaryReached = getRegisteredCallback<
        (boundary: string) => void
      >(
        context.mockPositionSource.onBoundaryReached as Mock,
        'onBoundaryReached'
      );

      onBoundaryReached('start');

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-restart',
        []
      );
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-firstframe when onActivated fires', async context => {
      await context.engine.init();

      const onActivated = getRegisteredCallback<() => void>(
        context.mockPositionSource.onActivated as Mock,
        'onActivated'
      );

      onActivated();

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-firstframe',
        []
      );
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-duration with a callable getDuration when onActivated fires', async context => {
      await context.engine.init();

      const onActivated = getRegisteredCallback<() => void>(
        context.mockPositionSource.onActivated as Mock,
        'onActivated'
      );

      onActivated();

      const durationCalls = (
        context.eventbus.broadcast as Mock
      ).mock.calls.filter(call => call[0] === 'timeline-duration');
      expect(durationCalls).toHaveLength(1);
      const [getDuration] = durationCalls[0][1];
      expect(getDuration()).toBe(10);
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-time when onPosition fires with new position', async context => {
      await context.engine.init();

      const onPosition = getRegisteredCallback<(position: number) => void>(
        context.mockPositionSource.onPosition as Mock,
        'onPosition'
      );

      onPosition(5);

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-time',
        [5]
      );
    });

    test<EligiusEngineSuiteContext>('should not broadcast timeline-time when position unchanged', async context => {
      await context.engine.init();

      const onPosition = getRegisteredCallback<(position: number) => void>(
        context.mockPositionSource.onPosition as Mock,
        'onPosition'
      );

      // Fire same position twice
      onPosition(5);
      (context.eventbus.broadcast as Mock).mockClear();
      onPosition(5);

      expect(context.eventbus.broadcast).not.toHaveBeenCalledWith(
        'timeline-time',
        [5]
      );
    });

    test<EligiusEngineSuiteContext>('should preserve fractional position in onPosition handler', async context => {
      await context.engine.init();

      const onPosition = getRegisteredCallback<(position: number) => void>(
        context.mockPositionSource.onPosition as Mock,
        'onPosition'
      );

      onPosition(5.7);

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-time',
        [5.7]
      );
    });
  });

  describe('timeline actions execution', () => {
    test<EligiusEngineSuiteContext>('should execute timeline action start at correct position', async context => {
      const actionStart = vi.fn().mockResolvedValue({});
      const actionEnd = vi.fn().mockResolvedValue({});
      context.configuration.timelines[0].timelineActions = [
        {
          id: 'test-action',
          // Action active from second 5 to second 10 of the timeline
          duration: {start: 5, end: 10},
          start: actionStart,
          end: actionEnd,
          active: false,
        },
      ];

      await context.engine.init();

      // Get and trigger onPosition callback at position 5
      const onPosition = getRegisteredCallback<(position: number) => void>(
        context.mockPositionSource.onPosition as Mock,
        'onPosition'
      );
      onPosition(5);

      expect(actionStart).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should execute timeline action end at correct position', async context => {
      const action = createStatefulMockAction(5, 10);
      context.configuration.timelines[0].timelineActions = [action];

      await context.engine.init();

      const onPosition = getRegisteredCallback<(position: number) => void>(
        context.mockPositionSource.onPosition as Mock,
        'onPosition'
      );
      onPosition(5);
      onPosition(10);

      expect(action.end).toHaveBeenCalledTimes(1);
    });

    test<EligiusEngineSuiteContext>('should set end duration to Infinity for negative end values', async context => {
      context.configuration.timelines[0].timelineActions = [
        {
          id: 'test-action',
          duration: {start: 5, end: -1},
          start: vi.fn(),
          end: vi.fn(),
          active: false,
        },
      ];

      await context.engine.init();

      expect(
        context.configuration.timelines[0].timelineActions[0].duration.end
      ).toBe(Infinity);
    });

    test<EligiusEngineSuiteContext>('should execute timeline action start at fractional position', async context => {
      const actionStart = vi.fn().mockResolvedValue({});
      const actionEnd = vi.fn().mockResolvedValue({});
      context.configuration.timelines[0].timelineActions = [
        {
          id: 'fractional-action',
          duration: {start: 5.3, end: 10.7},
          start: actionStart,
          end: actionEnd,
          active: false,
        },
      ];

      await context.engine.init();

      const onPosition = getRegisteredCallback<(position: number) => void>(
        context.mockPositionSource.onPosition as Mock,
        'onPosition'
      );
      onPosition(5.3);

      expect(actionStart).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should execute timeline action end at fractional position', async context => {
      const action = createStatefulMockAction(5.3, 10.7);
      context.configuration.timelines[0].timelineActions = [action];

      await context.engine.init();

      const onPosition = getRegisteredCallback<(position: number) => void>(
        context.mockPositionSource.onPosition as Mock,
        'onPosition'
      );
      onPosition(5.3);
      onPosition(10.7);

      expect(action.end).toHaveBeenCalledTimes(1);
    });

    test<EligiusEngineSuiteContext>('should start the action once when a position update crosses its fractional start', async context => {
      const action = createStatefulMockAction(5.3, 10.7);
      context.configuration.timelines[0].timelineActions = [action];

      await context.engine.init();

      const onPosition = getRegisteredCallback<(position: number) => void>(
        context.mockPositionSource.onPosition as Mock,
        'onPosition'
      );

      // Before the start (5.3): nothing happens
      onPosition(5.0);
      onPosition(5.2);
      expect(action.start).not.toHaveBeenCalled();

      // 5.2 -> 5.4 crosses 5.3, so the action starts even though no update
      // reported 5.3 exactly
      onPosition(5.4);
      onPosition(5.6);
      expect(action.start).toHaveBeenCalledTimes(1);
      expect(action.end).not.toHaveBeenCalled();
    });
  });

  describe('eventbus: request-timeline-uri', () => {
    test<EligiusEngineSuiteContext>('should switch to different timeline by URI', async context => {
      // Setup multiple timelines
      context.configuration.timelines = [
        {
          type: 'animation',
          uri: 'timeline-1',
          duration: 10,
          selector: '.content',
          loop: false,
          timelineActions: [],
        },
        {
          type: 'animation',
          uri: 'timeline-2',
          duration: 20,
          selector: '.content',
          loop: false,
          timelineActions: [],
        },
      ];
      // Add playlist to the provider
      const playlist = createMockPlaylist();
      context.providers.animation.playlist = playlist;
      rebuildEngine(context);
      await context.engine.init();

      context.eventbus.broadcast('request-timeline-uri', ['timeline-2']);

      // Wait for async handler to complete
      await vi.waitFor(() => {
        expect(playlist.selectItem).toHaveBeenCalledWith('timeline-2');
      });
      expect(context.mockPositionSource.deactivate).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-current-timeline-change event', async context => {
      context.configuration.timelines = [
        {
          type: 'animation',
          uri: 'timeline-1',
          duration: 10,
          selector: '.content',
          loop: false,
          timelineActions: [],
        },
        {
          type: 'animation',
          uri: 'timeline-2',
          duration: 20,
          selector: '.content',
          loop: false,
          timelineActions: [],
        },
      ];
      const playlist = createMockPlaylist();
      context.providers.animation.playlist = playlist;
      rebuildEngine(context);
      await context.engine.init();

      context.eventbus.broadcast('request-timeline-uri', ['timeline-2']);

      // Wait for async handler to complete
      await vi.waitFor(() => {
        expect(context.eventbus.broadcast).toHaveBeenCalledWith(
          'timeline-current-timeline-change',
          ['timeline-2']
        );
      });
    });

    test<EligiusEngineSuiteContext>('should not switch when URI matches current timeline', async context => {
      await context.engine.init();
      (context.mockPositionSource.deactivate as Mock).mockClear();

      // Request same timeline that's already active
      context.eventbus.broadcast('request-timeline-uri', ['timeline-1']);

      // deactivate should not be called for same URI
      expect(context.mockPositionSource.deactivate).not.toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should not switch when URI is not found in config', async context => {
      await context.engine.init();
      const playlist = createMockPlaylist(['timeline-1']); // Only one item
      context.providers.animation.playlist = playlist;

      context.eventbus.broadcast('request-timeline-uri', ['nonexistent-uri']);

      expect(playlist.selectItem).not.toHaveBeenCalledWith('nonexistent-uri');
    });

    test<EligiusEngineSuiteContext>('should set loop property from timeline config', async context => {
      context.configuration.timelines = [
        {
          type: 'animation',
          uri: 'timeline-1',
          duration: 10,
          selector: '.content',
          loop: false,
          timelineActions: [],
        },
        {
          type: 'animation',
          uri: 'timeline-2',
          duration: 20,
          selector: '.content',
          loop: true,
          timelineActions: [],
        },
      ];
      // Create a fresh position source with writable loop property
      const positionSourceWithLoop = createMockPositionSource();
      positionSourceWithLoop.loop = false;
      const playlist = createMockPlaylist();
      context.providers.animation = {
        id: 'animation-provider',
        positionSource: positionSourceWithLoop,
        containerProvider: context.mockContainerProvider,
        playlist,
      };
      rebuildEngine(context);
      await context.engine.init();

      expect(positionSourceWithLoop.loop).toBe(false);
      context.eventbus.broadcast('request-timeline-uri', ['timeline-2']);

      // Wait for async handler to complete
      await vi.waitFor(() => {
        expect(positionSourceWithLoop.loop).toBe(true);
      });
    });

    test<EligiusEngineSuiteContext>('should end active actions when switching timelines', async context => {
      const actionEnd = vi.fn().mockResolvedValue({});
      context.configuration.timelines = [
        {
          type: 'animation',
          uri: 'timeline-1',
          duration: 10,
          selector: '.content',
          loop: false,
          timelineActions: [
            {
              id: 'action-1',
              duration: {start: 0, end: 10},
              start: vi.fn().mockResolvedValue({}),
              end: actionEnd,
              active: true, // Marked as active
            },
          ],
        },
        {
          type: 'animation',
          uri: 'timeline-2',
          duration: 20,
          selector: '.content',
          loop: false,
          timelineActions: [],
        },
      ];
      const playlist = createMockPlaylist();
      context.providers.animation.playlist = playlist;
      rebuildEngine(context);
      await context.engine.init();

      context.eventbus.broadcast('request-timeline-uri', ['timeline-2']);

      // Wait for async cleanup
      await vi.waitFor(() => {
        expect(actionEnd).toHaveBeenCalled();
      });
    });

    test<EligiusEngineSuiteContext>('should deactivate (not destroy) the old position source when switching to a different provider type', async context => {
      // Create two distinct provider instances
      const animationPositionSource = createMockPositionSource();
      const videoPositionSource = createMockPositionSource();
      context.providers = {
        animation: {
          id: 'animation-provider',
          positionSource: animationPositionSource,
          containerProvider: context.mockContainerProvider,
        },
        video: {
          id: 'video-provider',
          positionSource: videoPositionSource,
          containerProvider: createMockContainerProvider(),
          playlist: {
            currentItem: {uri: 'timeline-2'},
            items: [{uri: 'timeline-2'}],
            selectItem: vi.fn(),
            onItemChange: vi.fn(),
          },
        },
      };
      context.configuration.timelines = [
        {
          type: 'animation',
          uri: 'timeline-1',
          duration: 10,
          selector: '.content',
          loop: false,
          timelineActions: [],
        },
        {
          type: 'video',
          uri: 'timeline-2',
          duration: 20,
          selector: '.content',
          loop: false,
          timelineActions: [],
        },
      ];
      rebuildEngine(context);
      await context.engine.init();

      // Verify animation position source was initialized first
      expect(animationPositionSource.init).toHaveBeenCalled();

      context.eventbus.broadcast('request-timeline-uri', ['timeline-2']);

      // Wait for async handler to complete
      await vi.waitFor(() => {
        expect(videoPositionSource.activate).toHaveBeenCalled();
      });
      // The new source is initialised on first use; the old one is kept so the
      // engine can switch back, and is only destroyed by engine.destroy()
      expect(videoPositionSource.init).toHaveBeenCalledTimes(1);
      expect(animationPositionSource.deactivate).toHaveBeenCalled();
      expect(animationPositionSource.destroy).not.toHaveBeenCalled();
      expect(context.providers.video.playlist.selectItem).toHaveBeenCalledWith(
        'timeline-2'
      );

      await context.engine.destroy();
      expect(animationPositionSource.destroy).toHaveBeenCalledTimes(1);
      expect(videoPositionSource.destroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('eventbus: request-timeline-cleanup', () => {
    test<EligiusEngineSuiteContext>('should end active actions on cleanup request', async context => {
      const actionEnd = vi.fn().mockResolvedValue({});
      context.configuration.timelines[0].timelineActions = [
        {
          id: 'action-1',
          duration: {start: 0, end: 10},
          start: vi.fn().mockResolvedValue({}),
          end: actionEnd,
          active: true,
        },
      ];
      await context.engine.init();

      context.eventbus.broadcast('request-timeline-cleanup', []);

      await vi.waitFor(() => {
        expect(actionEnd).toHaveBeenCalled();
      });
    });
  });

  describe('regression tests', () => {
    describe('_toggleplay should properly await start()', () => {
      test<EligiusEngineSuiteContext>('should await start() when toggling from stopped to playing', async context => {
        await context.engine.init();
        // State is 'inactive' by default after init (not started yet)

        // Make activate() take some time to verify await is working
        let activateResolved = false;
        (context.mockPositionSource.activate as Mock).mockImplementation(
          async () => {
            // Simulate async operation - use immediate promise to avoid real delays
            await Promise.resolve();
            // Use type assertion to bypass readonly check - the mock has a setter
            (context.mockPositionSource as {state: TSourceState}).state =
              'active';
            activateResolved = true;
          }
        );

        // Trigger toggle via eventbus
        context.eventbus.broadcast('timeline-play-toggle-request', []);

        // Use vi.waitFor for robust async handling - no arbitrary timeouts
        await vi.waitFor(() => {
          // If await was missing, activateResolved would still be false
          expect(activateResolved).toBe(true);
          expect(context.mockPositionSource.activate).toHaveBeenCalled();
        });
      });
    });

    describe('switchTimeline should not double-seek', () => {
      test<EligiusEngineSuiteContext>('should call source.seek only once when switching timeline with position', async context => {
        context.configuration.timelines = [
          {
            type: 'animation',
            uri: 'timeline-1',
            duration: 10,
            selector: '.content',
            loop: false,
            timelineActions: [],
          },
          {
            type: 'animation',
            uri: 'timeline-2',
            duration: 20,
            selector: '.content',
            loop: false, // non-looping to trigger the position seek logic
            timelineActions: [],
          },
        ];
        const playlist = createMockPlaylist();
        context.providers.animation.playlist = playlist;
        rebuildEngine(context);
        await context.engine.init();

        // Clear previous seek calls
        (context.mockPositionSource.seek as Mock).mockClear();

        // Switch to timeline-2 with a specific position
        context.eventbus.broadcast('request-timeline-uri', ['timeline-2', 5]);

        await vi.waitFor(() => {
          expect(context.mockPositionSource.activate).toHaveBeenCalled();
        });

        // Verify seek was called only once with the position, before the
        // source was activated
        const seekCalls = (context.mockPositionSource.seek as Mock).mock.calls;
        expect(seekCalls.length).toBe(1);
        expect(seekCalls[0][0]).toBe(5);
        expect(
          (context.mockPositionSource.seek as Mock).mock.invocationCallOrder[0]
        ).toBeLessThan(
          (context.mockPositionSource.activate as Mock).mock
            .invocationCallOrder[0]
        );
      });
    });

    describe('_executeSeekActions should handle empty timeline actions', () => {
      test<EligiusEngineSuiteContext>('should not throw when timeline has no actions', async context => {
        // Timeline with no actions
        context.configuration.timelines[0].timelineActions = [];
        await context.engine.init();
        (context.mockPositionSource.getDuration as Mock).mockReturnValue(100);
        (context.mockPositionSource.getPosition as Mock).mockReturnValue(0);

        // This should not throw even though there are no timeline actions
        await expect(context.engine.seek(50)).resolves.not.toThrow();
      });

      test<EligiusEngineSuiteContext>('should properly execute seek actions when switching from position with active actions', async context => {
        const actionStart = vi.fn().mockResolvedValue({});
        const actionEnd = vi.fn().mockResolvedValue({});
        context.configuration.timelines[0].timelineActions = [
          {
            id: 'test-action',
            duration: {start: 0, end: 30},
            start: actionStart,
            end: actionEnd,
            active: true, // Action is currently active
          },
        ];
        await context.engine.init();
        (context.mockPositionSource.getDuration as Mock).mockReturnValue(100);
        (context.mockPositionSource.getPosition as Mock).mockReturnValue(10);

        // Seek to position 50, which is outside the action's duration (0-30)
        await context.engine.seek(50);

        // The active action should have its end method called
        expect(actionEnd).toHaveBeenCalled();
      });
    });
  });

  describe('static methods', () => {
    describe('sortActionsPerPosition', () => {
      test('should sort end methods before start methods', () => {
        const startMethod = Object.assign(async () => ({}), {
          id: 'start',
          isStart: true,
        }) as any;
        const endMethod = Object.assign(async () => ({}), {
          id: 'end',
          isStart: false,
        }) as any;

        const result = EligiusEngine.sortActionsPerPosition([
          startMethod,
          endMethod,
        ]);

        expect(result[0].isStart).toBe(false);
        expect(result[1].isStart).toBe(true);
      });

      test('should sort end methods by highest start position first', () => {
        const endMethod1 = Object.assign(async () => ({}), {
          id: 'end1',
          isStart: false,
          startPosition: 5,
        }) as any;
        const endMethod2 = Object.assign(async () => ({}), {
          id: 'end2',
          isStart: false,
          startPosition: 10,
        }) as any;

        const result = EligiusEngine.sortActionsPerPosition([
          endMethod1,
          endMethod2,
        ]);

        expect(result[0].startPosition).toBe(10);
        expect(result[1].startPosition).toBe(5);
      });
    });
  });

  describe('interval dispatch and lifecycle (engine-core fixes)', () => {
    type ManualSource = IPositionSource &
      ISeekable & {report(position: number): void};

    /**
     * A position source that reports whatever positions the test feeds it,
     * like the video, scroll and keyboard sources do. It emits on activate and
     * on seek while active, exactly like BasePositionSource.
     */
    function createManualPositionSource(duration = 10): ManualSource {
      const positionCallbacks: Array<(position: number) => void> = [];
      const activatedCallbacks: Array<() => void> = [];
      let state: TSourceState = 'inactive';
      let position = 0;
      const emit = (value: number) => {
        positionCallbacks.forEach(callback => callback(value));
      };
      return {
        get state() {
          return state;
        },
        loop: false,
        init: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(() => {
          state = 'inactive';
        }),
        activate: vi.fn(async () => {
          if (state === 'active') {
            return;
          }
          state = 'active';
          emit(position);
          activatedCallbacks.forEach(callback => callback());
        }),
        suspend: vi.fn(() => {
          if (state === 'active') {
            state = 'suspended';
          }
        }),
        deactivate: vi.fn(() => {
          state = 'inactive';
          position = 0;
        }),
        getPosition: () => position,
        getDuration: () => duration,
        onPosition: vi.fn(callback => {
          positionCallbacks.push(callback);
        }),
        onBoundaryReached: vi.fn(),
        onActivated: vi.fn(callback => {
          activatedCallbacks.push(callback);
        }),
        seek: vi.fn(async (value: number) => {
          position = value;
          if (state === 'active') {
            emit(value);
          }
          return value;
        }),
        report(value: number) {
          position = value;
          if (state === 'active') {
            emit(value);
          }
        },
      };
    }

    function recordingAction(
      log: string[],
      name: string,
      start: number,
      end: number,
      withEnd = true
    ) {
      const record = (label: string) => (data: any) => {
        log.push(label);
        return data;
      };
      return new TimelineAction(
        name,
        [
          {
            id: `${name}-start`,
            systemName: 'record',
            operationData: {},
            instance: record(`${name}-start`),
          },
        ],
        withEnd
          ? [
              {
                id: `${name}-end`,
                systemName: 'record',
                operationData: {},
                instance: record(`${name}-end`),
              },
            ]
          : [],
        {start, end},
        createMockEventbus()
      );
    }

    function createEngineWith(
      context: EligiusEngineSuiteContext,
      source: IPositionSource,
      timelineActions: TimelineAction[],
      extraProviders: Record<string, ITimelineProviderInfo> = {}
    ) {
      context.configuration.timelines[0].timelineActions = timelineActions;
      return new EligiusEngine(
        context.configuration,
        context.eventbus,
        {
          animation: {positionSource: source},
          ...extraProviders,
        } as any,
        context.localeManager
      );
    }

    test<EligiusEngineSuiteContext>('given video-like positions that never hit a key exactly, when they are reported, then action [2,5] starts once and ends once', async context => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const engine = createEngineWith(context, source, [
        recordingAction(log, 'A', 2, 5),
      ]);
      await engine.init();
      await engine.start();

      [0.24, 1.98, 2.23, 2.48, 4.9, 5.12, 5.4].forEach(p => source.report(p));

      expect(log).toEqual(['A-start', 'A-end']);
    });

    test<EligiusEngineSuiteContext>('given keyboard steps of 0.1 that drift (0.30000000000000004), when stepping forward, then the action at 0.3 starts', async context => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const engine = createEngineWith(context, source, [
        recordingAction(log, 'A', 0.3, 1),
      ]);
      await engine.init();
      await engine.start();

      let position = 0;
      for (let i = 0; i < 3; i++) {
        position += 0.1;
        source.report(position);
      }

      expect(position).not.toBe(0.3);
      expect(log).toEqual(['A-start']);
    });

    test<EligiusEngineSuiteContext>('given actions A=[2,5] and B=[5,8], when stepping 0..6 and then back to 5 and 4, then A ends once, restarts at 4 and B is ended at 4', async context => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const a = recordingAction(log, 'A', 2, 5);
      const b = recordingAction(log, 'B', 5, 8);
      const engine = createEngineWith(context, source, [a, b]);
      await engine.init();
      await engine.start();

      // At 5, B's start waits until A's end has settled (ends before starts
      // within one position update), so let the end promises settle.
      const settle = () => new Promise(resolve => setTimeout(resolve, 0));

      [1, 2, 3, 4, 5, 6].forEach(p => source.report(p));
      await settle();
      expect(log).toEqual(['A-start', 'A-end', 'B-start']);

      source.report(5);
      await settle();
      expect(log).toEqual(['A-start', 'A-end', 'B-start']);

      source.report(4);
      await settle();
      expect(log).toEqual(['A-start', 'A-end', 'B-start', 'B-end', 'A-start']);
      expect(a.active).toBe(true);
      expect(b.active).toBe(false);
    });

    test<EligiusEngineSuiteContext>('given a playing timeline with a start-only action at 5, when seek(5) is called, then its startOperations run exactly once', async context => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const engine = createEngineWith(context, source, [
        recordingAction(log, 'S', 5, 10, false),
      ]);
      await engine.init();
      await engine.start();

      await engine.seek(5);

      expect(log).toEqual(['S-start']);
    });

    test<EligiusEngineSuiteContext>('given a paused seek onto a start-only action, when playback resumes, then its startOperations run exactly once', async context => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const engine = createEngineWith(context, source, [
        recordingAction(log, 'S', 5, 10, false),
      ]);
      await engine.init();
      await engine.start();
      engine.pause();

      await engine.seek(5);
      await engine.start();

      expect(log).toEqual(['S-start']);
    });

    test<EligiusEngineSuiteContext>('given an action [3,8] active at 5, when stop() is called and the source then ticks through 3, then it is ended on stop and started again at 3', async context => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const action = recordingAction(log, 'A', 3, 8);
      const engine = createEngineWith(context, source, [action]);
      await engine.init();
      await engine.start();
      source.report(5);
      expect(log).toEqual(['A-start']);

      await engine.stop();
      expect(log).toEqual(['A-start', 'A-end']);
      expect(action.active).toBe(false);

      await engine.start();
      [1, 2, 3].forEach(p => source.report(p));
      expect(log).toEqual(['A-start', 'A-end', 'A-start']);
    });

    test<EligiusEngineSuiteContext>('given an active timeline with a running action, when seek(NaN) is called, then nothing changes and seekStart is not emitted', async context => {
      const log: string[] = [];
      const source = createManualPositionSource();
      const engine = createEngineWith(context, source, [
        recordingAction(log, 'A', 0, 8),
      ]);
      await engine.init();
      await engine.start();
      source.report(2);
      const seekStart = vi.fn();
      engine.on('seekStart', seekStart);

      const result = await engine.seek(Number.NaN);

      expect(result).toBe(2);
      expect(engine.position).toBe(2);
      expect(seekStart).not.toHaveBeenCalled();
      expect(log).toEqual(['A-start']);
    });

    test<EligiusEngineSuiteContext>('given an initialised engine whose source reports 0, when request-current-timeline-position is broadcast, then the callback receives 0', async context => {
      await context.engine.init();
      const callback = vi.fn();

      context.eventbus.broadcast('request-current-timeline-position', [
        callback,
      ]);

      expect(callback).toHaveBeenCalledWith(0);
    });

    test<EligiusEngineSuiteContext>('given timelines set to an empty array, when init() is called, then it rejects with No timelines present', async context => {
      context.configuration.timelines = [];
      const engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.localeManager
      );

      await expect(engine.init()).rejects.toThrow('No timelines present');
    });

    test<EligiusEngineSuiteContext>('given an init action whose end operation throws, when destroy is called, then destroy rejects but the source was deactivated first and teardown still ran', async context => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const order: string[] = [];
      const source = createManualPositionSource();
      (source.deactivate as Mock).mockImplementation(() => {
        order.push('deactivate');
      });
      context.configuration.initActions = [
        new EndableAction(
          'failing',
          [],
          [
            {
              id: 'boom',
              systemName: 'boom',
              operationData: {},
              instance: () => {
                order.push('end-operation');
                throw new Error('boom');
              },
            },
          ],
          createMockEventbus()
        ),
      ];
      const engine = createEngineWith(context, source, []);
      await engine.init();
      await engine.start();

      await expect(engine.destroy()).rejects.toThrow('boom');

      expect(order).toEqual(['deactivate', 'end-operation']);
      expect(context.localeManager.destroy).toHaveBeenCalled();
      expect(source.destroy).toHaveBeenCalled();
      expect($('.test-container').children().length).toBe(0);
    });

    test<EligiusEngineSuiteContext>('given an animation first timeline and a mediaplayer second timeline, when switching to the mediaplayer timeline, then its source is initialised and wired and the old source is only destroyed by engine.destroy', async context => {
      const log: string[] = [];
      const animationSource = createManualPositionSource();
      const videoSource = createManualPositionSource(20);
      context.configuration.timelines.push({
        type: 'mediaplayer',
        uri: 'video-timeline',
        duration: 20,
        selector: '.content',
        loop: false,
        timelineActions: [recordingAction(log, 'V', 1, 3)],
      });
      const engine = createEngineWith(context, animationSource, [], {
        mediaplayer: {positionSource: videoSource},
      });
      await engine.init();
      await engine.start();
      expect(videoSource.init).not.toHaveBeenCalled();

      await engine.switchTimeline('video-timeline');

      expect(videoSource.init).toHaveBeenCalledTimes(1);
      expect(videoSource.onPosition).toHaveBeenCalledTimes(1);
      expect(videoSource.onActivated).toHaveBeenCalledTimes(1);
      expect(animationSource.destroy).not.toHaveBeenCalled();
      expect(engine.playState).toBe('playing');

      videoSource.report(1.5);
      expect(log).toEqual(['V-start']);
      // positions from the inactive animation source are ignored
      animationSource.report(2.5);
      expect(engine.position).toBe(1.5);

      await engine.switchTimeline('timeline-1');
      expect(animationSource.init).toHaveBeenCalledTimes(1);
      expect(animationSource.onPosition).toHaveBeenCalledTimes(1);

      await engine.destroy();
      expect(animationSource.destroy).toHaveBeenCalledTimes(1);
      expect(videoSource.destroy).toHaveBeenCalledTimes(1);
    });

    test<EligiusEngineSuiteContext>('given a looping second timeline, when switchTimeline(uri, 5) is awaited, then the source was seeked to 5 and is playing', async context => {
      const source = createManualPositionSource();
      const second = createManualPositionSource();
      context.configuration.timelines.push({
        type: 'animation',
        uri: 'timeline-2',
        duration: 10,
        selector: '.content',
        loop: true,
        timelineActions: [],
      });
      const engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        {animation: {positionSource: source}} as any,
        context.localeManager,
        {
          'timeline-1': {positionSource: source},
          'timeline-2': {positionSource: second},
        }
      );
      await engine.init();
      await engine.start();

      await engine.switchTimeline('timeline-2', 5);

      expect(second.seek).toHaveBeenCalledWith(5);
      expect(second.loop).toBe(true);
      expect(second.state).toBe('active');
      expect(engine.position).toBe(5);
      expect(source.state).toBe('inactive');
    });

    test<EligiusEngineSuiteContext>('given a container provider with a lifecycle, when the engine is initialised and destroyed, then the provider is initialised and destroyed', async context => {
      const containerProvider = {
        getContainer: vi.fn().mockReturnValue($('<div/>')),
        onContainerReady: vi.fn(),
        init: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
      };
      const engine = createEngineWith(
        context,
        createManualPositionSource(),
        []
      );
      (engine as any).timelineProviders.animation.containerProvider =
        containerProvider;

      await engine.init();
      expect(containerProvider.init).toHaveBeenCalledTimes(1);

      await engine.destroy();
      expect(containerProvider.destroy).toHaveBeenCalledTimes(1);
    });

    test<EligiusEngineSuiteContext>('given a directly constructed engine, when it starts and ticks, then it does not broadcast state events itself (EngineEventbusAdapter owns them)', async context => {
      const source = createManualPositionSource();
      const engine = createEngineWith(context, source, []);
      await engine.init();

      await engine.start();
      source.report(1);

      const broadcastNames = (
        context.eventbus.broadcast as Mock
      ).mock.calls.map(call => call[0]);
      expect(broadcastNames).not.toContain('timeline-play');
      expect(broadcastNames).not.toContain('timeline-time');
      expect(broadcastNames).not.toContain('timeline-firstframe');
      expect(broadcastNames).not.toContain('timeline-duration');
    });

    describe('action errors and end-before-start ordering', () => {
      const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

      function operation(id: string, instance: (data: any) => any) {
        return {id, systemName: 'record', operationData: {}, instance};
      }

      /**
       * A timeline action whose start or end operation throws `error`.
       */
      function failingAction(
        name: string,
        start: number,
        end: number,
        failingPhase: 'start' | 'end',
        error: unknown
      ) {
        const fail = () => {
          throw error;
        };
        const pass = (data: any) => data;
        const action = new TimelineAction(
          name,
          [operation(`${name}-start`, failingPhase === 'start' ? fail : pass)],
          [operation(`${name}-end`, failingPhase === 'end' ? fail : pass)],
          {start, end},
          createMockEventbus()
        );
        action.id = `${name}-id`;
        return action;
      }

      /**
       * A recording timeline action whose end operation only finishes when
       * the returned `release()` is called.
       */
      function slowEndingAction(
        log: string[],
        name: string,
        start: number,
        end: number
      ) {
        let release = () => {};
        const action = new TimelineAction(
          name,
          [
            operation(`${name}-start`, data => {
              log.push(`${name}-start`);
              return data;
            }),
          ],
          [
            operation(
              `${name}-end`,
              data =>
                new Promise(resolve => {
                  log.push(`${name}-end-begin`);
                  release = () => {
                    log.push(`${name}-end-done`);
                    resolve(data);
                  };
                })
            ),
          ],
          {start, end},
          createMockEventbus()
        );
        return {action, release: () => release()};
      }

      test<EligiusEngineSuiteContext>('given a timeline action whose start operation throws, when the position crosses its start, then the engine emits one error naming the action and the start phase', async context => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const boom = new Error('boom');
        const source = createManualPositionSource();
        const engine = createEngineWith(context, source, [
          failingAction('Failing', 2, 5, 'start', boom),
        ]);
        const onError = vi.fn();
        engine.on('error', onError);
        await engine.init();
        await engine.start();

        source.report(3);
        await flushAsync();

        expect(onError).toHaveBeenCalledTimes(1);
        const [error] = onError.mock.calls[0];
        expect(error).toBeInstanceOf(EngineActionError);
        expect(error).toBeInstanceOf(Error);
        expect(error).toMatchObject({
          actionName: 'Failing',
          actionId: 'Failing-id',
          phase: 'start',
          cause: boom,
        });
        expect(error.message).toBe("Error in action start 'Failing': boom");
      });

      test<EligiusEngineSuiteContext>('given a timeline action whose end operation throws, when the position crosses its end, then the engine emits one error with the end phase', async context => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const source = createManualPositionSource();
        const engine = createEngineWith(context, source, [
          failingAction('Failing', 2, 5, 'end', new Error('boom')),
        ]);
        const onError = vi.fn();
        engine.on('error', onError);
        await engine.init();
        await engine.start();

        source.report(3);
        source.report(6);
        await flushAsync();

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toMatchObject({
          actionName: 'Failing',
          phase: 'end',
        });
      });

      test<EligiusEngineSuiteContext>('given an error that carries operation context, when it is reported, then the engine error names the operation and its index', async context => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const cause = Object.assign(new Error('no element'), {
          operationSystemName: 'selectElement',
          operationIndex: 2,
        });
        const source = createManualPositionSource();
        const engine = createEngineWith(context, source, [
          failingAction('Failing', 2, 5, 'start', cause),
        ]);
        const onError = vi.fn();
        engine.on('error', onError);
        await engine.init();
        await engine.start();

        source.report(3);
        await flushAsync();

        const [error] = onError.mock.calls[0];
        expect(error).toMatchObject({
          operationSystemName: 'selectElement',
          operationIndex: 2,
        });
        expect(error.message).toBe(
          "Error in action start 'Failing' at operation 'selectElement' (index 2): no element"
        );
      });

      test<EligiusEngineSuiteContext>('given no error listener, when a dispatched action fails, then the error is logged with the action name and message', async context => {
        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const source = createManualPositionSource();
        const engine = createEngineWith(context, source, [
          failingAction('Failing', 2, 5, 'start', new Error('boom')),
        ]);
        await engine.init();
        await engine.start();

        source.report(3);
        await flushAsync();

        expect(consoleError).toHaveBeenCalledWith(
          "Error in action start 'Failing': boom"
        );
      });

      test<EligiusEngineSuiteContext>('given an error listener, when a dispatched action fails, then the engine does not log the error itself', async context => {
        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const source = createManualPositionSource();
        const engine = createEngineWith(context, source, [
          failingAction('Failing', 2, 5, 'start', new Error('boom')),
        ]);
        engine.on('error', () => {});
        await engine.init();
        await engine.start();

        source.report(3);
        await flushAsync();

        expect(consoleError).not.toHaveBeenCalledWith(
          expect.stringContaining('boom')
        );
      });

      test<EligiusEngineSuiteContext>('given an error listener that unsubscribed twice, when a dispatched action fails, then the error is logged again', async context => {
        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const source = createManualPositionSource();
        const engine = createEngineWith(context, source, [
          failingAction('Failing', 2, 5, 'start', new Error('boom')),
        ]);
        const unsubscribe = engine.on('error', () => {});
        unsubscribe();
        unsubscribe();
        await engine.init();
        await engine.start();

        source.report(3);
        await flushAsync();

        expect(consoleError).toHaveBeenCalledWith(
          "Error in action start 'Failing': boom"
        );
      });

      test<EligiusEngineSuiteContext>('given A=[2,6] with a slow end and B=[5,8], when one update jumps from 3 to 7, then B starts only after A has ended', async context => {
        const log: string[] = [];
        const source = createManualPositionSource();
        const a = slowEndingAction(log, 'A', 2, 6);
        const b = recordingAction(log, 'B', 5, 8);
        const engine = createEngineWith(context, source, [a.action, b]);
        await engine.init();
        await engine.start();
        source.report(3);

        source.report(7);
        await flushAsync();

        expect(log).toEqual(['A-start', 'A-end-begin']);

        a.release();
        await flushAsync();

        expect(log).toEqual([
          'A-start',
          'A-end-begin',
          'A-end-done',
          'B-start',
        ]);
        expect(b.active).toBe(true);
      });

      test<EligiusEngineSuiteContext>('given an action whose end operation fails, when a start at the same position waits for it, then the start still runs and the error is reported', async context => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const log: string[] = [];
        const source = createManualPositionSource();
        const engine = createEngineWith(context, source, [
          failingAction('A', 2, 5, 'end', new Error('boom')),
          recordingAction(log, 'B', 5, 8),
        ]);
        const onError = vi.fn();
        engine.on('error', onError);
        await engine.init();
        await engine.start();
        source.report(3);

        source.report(5);
        await flushAsync();

        expect(log).toEqual(['B-start']);
        expect(onError).toHaveBeenCalledTimes(1);
      });

      test<EligiusEngineSuiteContext>('given a start waiting for a slow end, when stop() is called before the end finishes, then the waiting start never runs', async context => {
        const log: string[] = [];
        const source = createManualPositionSource();
        const a = slowEndingAction(log, 'A', 2, 5);
        const b = recordingAction(log, 'B', 5, 8);
        const engine = createEngineWith(context, source, [a.action, b]);
        await engine.init();
        await engine.start();
        source.report(3);
        source.report(5);

        await engine.stop();
        a.release();
        await flushAsync();

        expect(log).toEqual(['A-start', 'A-end-begin', 'A-end-done']);
        expect(b.active).toBe(false);
      });

      test<EligiusEngineSuiteContext>('given a start waiting for a slow end, when a later update passes its end, then it starts and ends once after the slow end', async context => {
        const log: string[] = [];
        const source = createManualPositionSource();
        const a = slowEndingAction(log, 'A', 2, 5);
        const b = recordingAction(log, 'B', 5, 6);
        const engine = createEngineWith(context, source, [a.action, b]);
        await engine.init();
        await engine.start();
        source.report(3);
        source.report(5);

        source.report(7);
        a.release();
        await flushAsync();

        expect(log).toEqual([
          'A-start',
          'A-end-begin',
          'A-end-done',
          'B-start',
          'B-end',
        ]);
        expect(b.active).toBe(false);
      });

      test<EligiusEngineSuiteContext>('given an active action whose end fails, when request-timeline-cleanup is broadcast, then the engine emits an end-phase error', async context => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const source = createManualPositionSource();
        const engine = createEngineWith(context, source, [
          failingAction('Failing', 2, 5, 'end', new Error('boom')),
        ]);
        const onError = vi.fn();
        engine.on('error', onError);
        await engine.init();
        await engine.start();
        source.report(3);

        context.eventbus.broadcast('request-timeline-cleanup', []);
        await flushAsync();

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toMatchObject({
          actionName: 'Failing',
          phase: 'end',
        });
      });

      test<EligiusEngineSuiteContext>('given an active action whose end fails, when stop() is awaited, then it resolves and the engine emits an end-phase error', async context => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const source = createManualPositionSource();
        const engine = createEngineWith(context, source, [
          failingAction('Failing', 2, 5, 'end', new Error('boom')),
        ]);
        const onError = vi.fn();
        engine.on('error', onError);
        await engine.init();
        await engine.start();
        source.report(3);

        await expect(engine.stop()).resolves.toBeUndefined();

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toMatchObject({phase: 'end'});
      });
    });

    describe('destroy() detaches controllers left on elements', () => {
      function createController(name: string, log: string[] = []) {
        return {
          name,
          init: vi.fn(),
          attach: vi.fn(),
          detach: vi.fn(() => {
            log.push(`${name}-detach`);
          }),
        };
      }

      test<EligiusEngineSuiteContext>('given controllers on the engine root and a nested element, when destroy() is awaited, then each is detached once with the eventbus', async context => {
        const engine = createEngineWith(
          context,
          createManualPositionSource(),
          []
        );
        await engine.init();
        const onRoot = createController('RootController');
        const nested = createController('NestedController');
        const second = createController('SecondController');
        attachControllerToElement($('.test-container'), onRoot);
        attachControllerToElement($('.content'), nested);
        attachControllerToElement($('.content'), second);

        await engine.destroy();

        expect(onRoot.detach).toHaveBeenCalledTimes(1);
        expect(onRoot.detach).toHaveBeenCalledWith(context.eventbus);
        expect(nested.detach).toHaveBeenCalledTimes(1);
        expect(second.detach).toHaveBeenCalledTimes(1);
      });

      test<EligiusEngineSuiteContext>('given a controller already removed with removeControllerFromElement, when destroy() is awaited, then it is not detached again', async context => {
        const engine = createEngineWith(
          context,
          createManualPositionSource(),
          []
        );
        await engine.init();
        const controller = createController('LabelController');
        attachControllerToElement($('.content'), controller);
        removeControllerFromElement.call({eventbus: context.eventbus} as any, {
          selectedElement: $('.content'),
          controllerName: 'LabelController',
        });

        await engine.destroy();

        expect(controller.detach).toHaveBeenCalledTimes(1);
      });

      test<EligiusEngineSuiteContext>('given an init action with end operations, when destroy() is awaited, then controllers are detached after the end operations ran', async context => {
        const log: string[] = [];
        context.configuration.initActions = [
          new EndableAction(
            'init',
            [],
            [
              operation('end-op', (data: any) => {
                log.push('end-operation');
                return data;
              }),
            ],
            createMockEventbus()
          ),
        ];
        const engine = createEngineWith(
          context,
          createManualPositionSource(),
          []
        );
        await engine.init();
        attachControllerToElement($('.content'), createController('C', log));

        await engine.destroy();

        expect(log).toEqual(['end-operation', 'C-detach']);
      });

      test<EligiusEngineSuiteContext>('given a controller whose detach throws, when destroy() is awaited, then it rejects with that error after detaching the others and finishing teardown', async context => {
        const source = createManualPositionSource();
        const engine = createEngineWith(context, source, []);
        await engine.init();
        const failing = createController('Failing');
        failing.detach.mockImplementation(() => {
          throw new Error('detach failed');
        });
        const other = createController('Other');
        attachControllerToElement($('.content'), failing);
        attachControllerToElement($('.content'), other);

        await expect(engine.destroy()).rejects.toThrow('detach failed');

        expect(other.detach).toHaveBeenCalledTimes(1);
        expect(source.destroy).toHaveBeenCalled();
        expect($('.test-container').children().length).toBe(0);
      });

      function operation(id: string, instance: (data: any) => any) {
        return {id, systemName: 'record', operationData: {}, instance};
      }
    });
  });
});
