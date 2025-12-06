import type {IEventbus} from '@eventbus/types.ts';
import type {ITimelineProvider} from '@timelineproviders/types.ts';
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
import type {LanguageManager} from '../../language-manager.ts';
import {createMockEventbus} from '../fixtures/eventbus-factory.ts';

interface EligiusEngineSuiteContext {
  engine: EligiusEngine;
  configuration: any;
  eventbus: IEventbus;
  providers: any;
  languageManager: LanguageManager;
  mockProvider: ITimelineProvider;
}

function createMockTimelineProvider(): ITimelineProvider {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn().mockResolvedValue(0),
    getPosition: vi.fn().mockReturnValue(0),
    getDuration: vi.fn().mockReturnValue(10),
    getContainer: vi.fn().mockReturnValue($('<div/>')),
    playlistItem: vi.fn(),
    onTime: vi.fn(),
    onComplete: vi.fn(),
    onFirstFrame: vi.fn(),
    onRestart: vi.fn(),
    playState: 'stopped' as const,
    loop: false,
  };
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
        duration: 10,
        selector: '.content',
        loop: false,
        timelineActions: [],
      },
    ],
    ...overrides,
  };
}

describe('EligiusEngine', () => {
  beforeEach<EligiusEngineSuiteContext>(context => {
    // Setup DOM
    $('<div class="test-container"/>').appendTo(document.body);

    // Setup mocks
    context.mockProvider = createMockTimelineProvider();
    context.eventbus = createMockEventbus();
    context.languageManager = {
      destroy: vi.fn(),
    } as unknown as LanguageManager;
    context.providers = {
      animation: {
        provider: context.mockProvider,
      },
    };
    context.configuration = createMinimalConfiguration();

    context.engine = new EligiusEngine(
      context.configuration,
      context.eventbus,
      context.providers,
      context.languageManager
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
    test<EligiusEngineSuiteContext>('position should return current provider position', async context => {
      await context.engine.init();
      (context.mockProvider.getPosition as Mock).mockReturnValue(5.7);

      expect(context.engine.position).toBe(5);
    });

    test<EligiusEngineSuiteContext>('position should return 0 when no provider', context => {
      expect(context.engine.position).toBe(0);
    });

    test<EligiusEngineSuiteContext>('duration should return provider duration', async context => {
      await context.engine.init();
      (context.mockProvider.getDuration as Mock).mockReturnValue(60);

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
      (context.mockProvider.getContainer as Mock).mockReturnValue(
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

    test<EligiusEngineSuiteContext>('should emit time event with position', async context => {
      const handler = vi.fn();
      await context.engine.init();

      context.engine.on('time', handler);
      // Simulate onTime callback from provider
      const onTimeCallback = (context.mockProvider.onTime as Mock).mock
        .calls[0][0];
      onTimeCallback(5.5);

      expect(handler).toHaveBeenCalledWith(5);
    });

    test<EligiusEngineSuiteContext>('should emit initialized event after init', async context => {
      const handler = vi.fn();
      context.engine.on('initialized', handler);

      await context.engine.init();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('start()', () => {
    test<EligiusEngineSuiteContext>('should start provider and set playState to playing', async context => {
      await context.engine.init();

      await context.engine.start();

      expect(context.mockProvider.start).toHaveBeenCalled();
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
    test<EligiusEngineSuiteContext>('should pause provider and set playState to paused', async context => {
      await context.engine.init();
      await context.engine.start();

      context.engine.pause();

      expect(context.mockProvider.pause).toHaveBeenCalled();
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
    test<EligiusEngineSuiteContext>('should stop provider and set playState to stopped', async context => {
      await context.engine.init();
      await context.engine.start();

      context.engine.stop();

      expect(context.mockProvider.stop).toHaveBeenCalled();
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
      (context.mockProvider.getDuration as Mock).mockReturnValue(100);
      (context.mockProvider.getPosition as Mock).mockReturnValue(50);

      const result = await context.engine.seek(50);

      expect(context.mockProvider.seek).toHaveBeenCalledWith(50);
      expect(result).toBe(50);
    });

    test<EligiusEngineSuiteContext>('should emit seekStart and seekComplete events', async context => {
      const seekStartHandler = vi.fn();
      const seekCompleteHandler = vi.fn();
      await context.engine.init();
      (context.mockProvider.getDuration as Mock).mockReturnValue(100);
      (context.mockProvider.getPosition as Mock).mockReturnValue(25);
      context.engine.on('seekStart', seekStartHandler);
      context.engine.on('seekComplete', seekCompleteHandler);

      await context.engine.seek(50);

      expect(seekStartHandler).toHaveBeenCalledWith(50, 25, 100);
      expect(seekCompleteHandler).toHaveBeenCalledWith(25, 100);
    });

    test<EligiusEngineSuiteContext>('should return current position when out of bounds', async context => {
      await context.engine.init();
      (context.mockProvider.getDuration as Mock).mockReturnValue(100);
      (context.mockProvider.getPosition as Mock).mockReturnValue(25);

      const result = await context.engine.seek(150);

      expect(result).toBe(25);
      expect(context.mockProvider.seek).not.toHaveBeenCalled();
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
        context.languageManager
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
        context.languageManager
      );

      await expect(engine.init()).rejects.toThrow('No timelines present');
    });

    test<EligiusEngineSuiteContext>('should throw error when no provider for timeline type', async context => {
      context.providers = {}; // No providers
      const engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.languageManager
      );

      await expect(engine.init()).rejects.toThrow(
        'No timeline provider configured for type animation'
      );
    });

    test<EligiusEngineSuiteContext>('should initialize the timeline provider', async context => {
      await context.engine.init();

      expect(context.mockProvider.init).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should register onTime callback with provider', async context => {
      await context.engine.init();

      expect(context.mockProvider.onTime).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test<EligiusEngineSuiteContext>('should register onComplete callback with provider', async context => {
      await context.engine.init();

      expect(context.mockProvider.onComplete).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test<EligiusEngineSuiteContext>('should register onFirstFrame callback with provider', async context => {
      await context.engine.init();

      expect(context.mockProvider.onFirstFrame).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test<EligiusEngineSuiteContext>('should register onRestart callback with provider', async context => {
      await context.engine.init();

      expect(context.mockProvider.onRestart).toHaveBeenCalledWith(
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

    test<EligiusEngineSuiteContext>('should return the timeline provider', async context => {
      const result = await context.engine.init();

      expect(result).toBe(context.mockProvider);
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

      expect(context.languageManager.destroy).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should destroy all timeline providers', async context => {
      await context.engine.init();

      await context.engine.destroy();

      expect(context.mockProvider.destroy).toHaveBeenCalled();
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
    test<EligiusEngineSuiteContext>('should start the timeline provider', async context => {
      await context.engine.init();

      context.eventbus.broadcast('timeline-play-request', []);
      // Wait for async handler to complete
      await Promise.resolve();

      expect(context.mockProvider.start).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-play event', async context => {
      await context.engine.init();

      context.eventbus.broadcast('timeline-play-request', []);
      // Wait for async handler to complete
      await Promise.resolve();

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-play',
        []
      );
    });
  });

  describe('eventbus: timeline-pause-request', () => {
    test<EligiusEngineSuiteContext>('should pause the timeline provider', async context => {
      await context.engine.init();

      context.eventbus.broadcast('timeline-pause-request', []);

      expect(context.mockProvider.pause).toHaveBeenCalled();
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
    test<EligiusEngineSuiteContext>('should stop the timeline provider', async context => {
      await context.engine.init();

      context.eventbus.broadcast('timeline-stop-request', []);

      expect(context.mockProvider.stop).toHaveBeenCalled();
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
    test<EligiusEngineSuiteContext>('should pause when currently running', async context => {
      await context.engine.init();
      (context.mockProvider as any).playState = 'running';

      context.eventbus.broadcast('timeline-play-toggle-request', []);

      expect(context.mockProvider.pause).toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should start when currently stopped', async context => {
      await context.engine.init();
      (context.mockProvider as any).playState = 'stopped';

      context.eventbus.broadcast('timeline-play-toggle-request', []);
      // Wait for async handler to complete
      await Promise.resolve();

      expect(context.mockProvider.start).toHaveBeenCalled();
    });
  });

  describe('eventbus: timeline-seek-request', () => {
    test<EligiusEngineSuiteContext>('should seek to the requested position', async context => {
      await context.engine.init();
      (context.mockProvider.getDuration as Mock).mockReturnValue(100);

      context.eventbus.broadcast('timeline-seek-request', [50]);

      expect(context.mockProvider.seek).toHaveBeenCalledWith(50);
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-seek event before seeking', async context => {
      await context.engine.init();
      (context.mockProvider.getDuration as Mock).mockReturnValue(100);
      (context.mockProvider.getPosition as Mock).mockReturnValue(25);

      context.eventbus.broadcast('timeline-seek-request', [50]);

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-seek',
        [50, 25, 100]
      );
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-seeked event after seeking', async context => {
      await context.engine.init();
      (context.mockProvider.getDuration as Mock).mockReturnValue(100);
      (context.mockProvider.getPosition as Mock).mockReturnValue(50);

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

      expect(context.mockProvider.seek).not.toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should not seek when position is above duration', async context => {
      await context.engine.init();
      (context.mockProvider.getDuration as Mock).mockReturnValue(100);

      context.eventbus.broadcast('timeline-seek-request', [150]);

      expect(context.mockProvider.seek).not.toHaveBeenCalled();
    });

    test<EligiusEngineSuiteContext>('should floor the seek position', async context => {
      await context.engine.init();
      (context.mockProvider.getDuration as Mock).mockReturnValue(100);

      context.eventbus.broadcast('timeline-seek-request', [50.7]);

      expect(context.mockProvider.seek).toHaveBeenCalledWith(50);
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
      (context.mockProvider.getContainer as Mock).mockReturnValue(
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
      (context.mockProvider.getDuration as Mock).mockReturnValue(60);
      const callback = vi.fn();

      context.eventbus.broadcast('timeline-duration-request', [callback]);

      expect(callback).toHaveBeenCalledWith(60);
    });
  });

  describe('eventbus: request-current-timeline-position', () => {
    test<EligiusEngineSuiteContext>('should call callback with floored position', async context => {
      await context.engine.init();
      (context.mockProvider.getPosition as Mock).mockReturnValue(5.7);
      const callback = vi.fn();

      context.eventbus.broadcast('request-current-timeline-position', [
        callback,
      ]);

      expect(callback).toHaveBeenCalledWith(5);
    });

    test<EligiusEngineSuiteContext>('should return -1 when no active provider', async context => {
      // Don't initialize, so no active provider
      // But we need eventbus listeners, so manually set up a minimal scenario
      context.configuration.timelines = [];
      const engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.languageManager
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

  describe('timeline provider callbacks', () => {
    test<EligiusEngineSuiteContext>('should broadcast timeline-complete when onComplete fires', async context => {
      await context.engine.init();

      // Get the onComplete callback that was registered
      const onCompleteCall = (context.mockProvider.onComplete as Mock).mock
        .calls[0];
      const onCompleteCallback = onCompleteCall[0];

      // Trigger it
      onCompleteCallback();

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-complete',
        []
      );
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-firstframe when onFirstFrame fires', async context => {
      await context.engine.init();

      const onFirstFrameCall = (context.mockProvider.onFirstFrame as Mock).mock
        .calls[0];
      const onFirstFrameCallback = onFirstFrameCall[0];

      onFirstFrameCallback();

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-firstframe',
        []
      );
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-duration when onFirstFrame fires', async context => {
      await context.engine.init();

      const onFirstFrameCall = (context.mockProvider.onFirstFrame as Mock).mock
        .calls[0];
      const onFirstFrameCallback = onFirstFrameCall[0];

      onFirstFrameCallback();

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-duration',
        [context.mockProvider.getDuration]
      );
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-restart when onRestart fires', async context => {
      await context.engine.init();

      const onRestartCall = (context.mockProvider.onRestart as Mock).mock
        .calls[0];
      const onRestartCallback = onRestartCall[0];

      onRestartCallback();

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-restart',
        []
      );
    });

    test<EligiusEngineSuiteContext>('should broadcast timeline-time when onTime fires with new position', async context => {
      await context.engine.init();

      const onTimeCall = (context.mockProvider.onTime as Mock).mock.calls[0];
      const onTimeCallback = onTimeCall[0];

      // Fire time update
      onTimeCallback(5);

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-time',
        [5]
      );
    });

    test<EligiusEngineSuiteContext>('should not broadcast timeline-time when position unchanged', async context => {
      await context.engine.init();

      const onTimeCall = (context.mockProvider.onTime as Mock).mock.calls[0];
      const onTimeCallback = onTimeCall[0];

      // Fire same position twice
      onTimeCallback(5);
      (context.eventbus.broadcast as Mock).mockClear();
      onTimeCallback(5);

      expect(context.eventbus.broadcast).not.toHaveBeenCalledWith(
        'timeline-time',
        [5]
      );
    });

    test<EligiusEngineSuiteContext>('should floor position in onTime handler', async context => {
      await context.engine.init();

      const onTimeCall = (context.mockProvider.onTime as Mock).mock.calls[0];
      const onTimeCallback = onTimeCall[0];

      onTimeCallback(5.7);

      expect(context.eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-time',
        [5]
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
          duration: {start: 5, end: 10},
          start: actionStart,
          end: actionEnd,
          active: false,
        },
      ];

      await context.engine.init();

      // Get and trigger onTime callback at position 5
      const onTimeCall = (context.mockProvider.onTime as Mock).mock.calls[0];
      const onTimeCallback = onTimeCall[0];
      onTimeCallback(5);

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

      const onTimeCall = (context.mockProvider.onTime as Mock).mock.calls[0];
      const onTimeCallback = onTimeCall[0];
      onTimeCallback(10);

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
      context.engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.languageManager
      );
      await context.engine.init();

      context.eventbus.broadcast('request-timeline-uri', ['timeline-2']);

      // Wait for async handler to complete
      await vi.waitFor(() => {
        expect(context.mockProvider.playlistItem).toHaveBeenCalledWith(
          'timeline-2'
        );
      });
      expect(context.mockProvider.stop).toHaveBeenCalled();
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
      context.engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.languageManager
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
      (context.mockProvider.stop as Mock).mockClear();

      // Request same timeline that's already active
      context.eventbus.broadcast('request-timeline-uri', ['timeline-1']);

      // stop() is called but playlistItem should not be called for same URI
      expect(context.mockProvider.playlistItem).not.toHaveBeenCalledWith(
        'timeline-1'
      );
    });

    test<EligiusEngineSuiteContext>('should not switch when URI is not found in config', async context => {
      await context.engine.init();

      context.eventbus.broadcast('request-timeline-uri', ['nonexistent-uri']);

      expect(context.mockProvider.playlistItem).not.toHaveBeenCalledWith(
        'nonexistent-uri'
      );
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
      // Create a fresh provider with writable loop property
      const providerWithLoop = {
        ...createMockTimelineProvider(),
        loop: false,
      };
      context.providers.animation = {provider: providerWithLoop};
      context.engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.languageManager
      );
      await context.engine.init();

      expect(providerWithLoop.loop).toBe(false);
      context.eventbus.broadcast('request-timeline-uri', ['timeline-2']);

      // Wait for async handler to complete
      await vi.waitFor(() => {
        expect(providerWithLoop.loop).toBe(true);
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
      context.engine = new EligiusEngine(
        context.configuration,
        context.eventbus,
        context.providers,
        context.languageManager
      );
      await context.engine.init();

      context.eventbus.broadcast('request-timeline-uri', ['timeline-2']);

      // Wait for async cleanup
      await vi.waitFor(() => {
        expect(actionEnd).toHaveBeenCalled();
      });
    });

    test<EligiusEngineSuiteContext>('should destroy old provider when switching to different provider type', async context => {
      // Create two distinct provider instances
      const animationProvider = createMockTimelineProvider();
      const videoProvider = createMockTimelineProvider();
      context.providers = {
        animation: {provider: animationProvider},
        video: {provider: videoProvider},
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
        context.languageManager
      );
      await context.engine.init();

      // Verify animation provider was initialized first
      expect(animationProvider.init).toHaveBeenCalled();

      context.eventbus.broadcast('request-timeline-uri', ['timeline-2']);

      // Wait for async handler to complete
      await vi.waitFor(() => {
        // Animation provider should be destroyed when switching to video
        expect(animationProvider.destroy).toHaveBeenCalled();
      });
      expect(videoProvider.playlistItem).toHaveBeenCalledWith('timeline-2');
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
