import type {IEventbus} from '@eventbus/types.ts';
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
import {EligiusEngine} from '../../eligius-engine.ts';
import type {ILocaleManager} from '../../locale/types.ts';
import type {ITimelineProviderInfo} from '../../types.ts';
import {createMockEventbus} from '../fixtures/eventbus-factory.ts';

interface EligiusEngineSuiteContext {
  engine: EligiusEngine;
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

describe('EligiusEngine', () => {
  beforeEach<EligiusEngineSuiteContext>(context => {
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

    context.engine = new EligiusEngine(
      context.configuration,
      context.eventbus,
      context.providers,
      context.localeManager
    );
  });

  afterEach<EligiusEngineSuiteContext>(context => {
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

    test<EligiusEngineSuiteContext>('should register eventbus listeners', async context => {
      await context.engine.init();

      // Verify key event listeners are registered
      expect(context.eventbus.on).toHaveBeenCalledWith(
        'timeline-play-request',
        expect.any(Function),
        undefined
      );
      expect(context.eventbus.on).toHaveBeenCalledWith(
        'timeline-pause-request',
        expect.any(Function),
        undefined
      );
      expect(context.eventbus.on).toHaveBeenCalledWith(
        'timeline-stop-request',
        expect.any(Function),
        undefined
      );
      expect(context.eventbus.on).toHaveBeenCalledWith(
        'timeline-seek-request',
        expect.any(Function),
        undefined
      );
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

    test<EligiusEngineSuiteContext>('should broadcast timeline-duration when onActivated fires', async context => {
      await context.engine.init();

      const onActivated = getRegisteredCallback<() => void>(
        context.mockPositionSource.onActivated as Mock,
        'onActivated'
      );

      onActivated();

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-duration',
        [context.mockPositionSource.getDuration]
      );
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
      const actionStart = vi.fn().mockResolvedValue({});
      const actionEnd = vi.fn().mockResolvedValue({});
      context.configuration.timelines[0].timelineActions = [
        {
          id: 'test-action',
          duration: {start: 5, end: 10},
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
      onPosition(10);

      expect(actionEnd).toHaveBeenCalled();
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
      onPosition(10.7);

      expect(actionEnd).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should not trigger action at non-matching fractional position', async context => {
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

      // Trigger at 5.0 - should not call action start (start is 5.3)
      onPosition(5.0);
      expect(actionStart).not.toHaveBeenCalled();

      // Trigger at 5.2 - should not call action start (start is 5.3)
      onPosition(5.2);
      expect(actionStart).not.toHaveBeenCalled();

      // Trigger at 5.4 - should not call action start (start is 5.3)
      onPosition(5.4);
      expect(actionStart).not.toHaveBeenCalled();
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
      context.engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.localeManager
      );
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
      context.engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.localeManager
      );
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
      context.engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.localeManager
      );
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
      context.engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.localeManager
      );
      await context.engine.init();

      context.eventbus.broadcast('request-timeline-uri', ['timeline-2']);

      // Wait for async cleanup
      await vi.waitFor(() => {
        expect(actionEnd).toHaveBeenCalled();
      });
    });

    test<EligiusEngineSuiteContext>('should destroy old position source when switching to different provider type', async context => {
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
      context.engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.localeManager
      );
      await context.engine.init();

      // Verify animation position source was initialized first
      expect(animationPositionSource.init).toHaveBeenCalled();

      context.eventbus.broadcast('request-timeline-uri', ['timeline-2']);

      // Wait for async handler to complete
      await vi.waitFor(() => {
        // Animation position source should be destroyed when switching to video
        expect(animationPositionSource.destroy).toHaveBeenCalled();
      });
      expect(context.providers.video.playlist.selectItem).toHaveBeenCalledWith(
        'timeline-2'
      );
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
        context.engine = new EligiusEngine(
          context.configuration,
          context.eventbus,
          context.providers,
          context.localeManager
        );
        await context.engine.init();

        // Clear previous seek calls
        (context.mockPositionSource.seek as Mock).mockClear();

        // Switch to timeline-2 with a specific position
        context.eventbus.broadcast('request-timeline-uri', ['timeline-2', 5]);

        // Trigger the firstframe event to simulate the callback
        await vi.waitFor(() => {
          expect(context.eventbus.once).toHaveBeenCalledWith(
            'timeline-firstframe',
            expect.any(Function)
          );
        });

        // Get the firstframe callback and call it
        const onceCall = (context.eventbus.once as Mock).mock.calls.find(
          (call: any[]) => call[0] === 'timeline-firstframe'
        );
        if (onceCall) {
          await onceCall[1](); // Execute the callback
        }

        // Verify seek was called only once with the position
        const seekCalls = (context.mockPositionSource.seek as Mock).mock.calls;
        expect(seekCalls.length).toBe(1);
        expect(seekCalls[0][0]).toBe(5);
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
});
