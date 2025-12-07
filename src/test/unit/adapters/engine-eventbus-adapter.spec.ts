import type {IEventbus} from '@eventbus/types.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import {EngineEventbusAdapter} from '../../../adapters/engine-eventbus-adapter.ts';
import type {IEligiusEngine} from '../../../types.ts';
import {createMockEventbus} from '../../fixtures/eventbus-factory.ts';

type AdapterSuiteContext = {
  engine: IEligiusEngine;
  eventbus: IEventbus;
  adapter: EngineEventbusAdapter;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

describe<AdapterSuiteContext>('EngineEventbusAdapter', () => {
  beforeEach(context => {
    withContext<AdapterSuiteContext>(context);

    // Create mock engine with pure API
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
    context.adapter = new EngineEventbusAdapter(
      context.engine,
      context.eventbus
    );
  });

  describe('constructor', () => {
    test<AdapterSuiteContext>('should create an instance', context => {
      expect(context.adapter).toBeDefined();
    });
  });

  describe('connect()', () => {
    test<AdapterSuiteContext>('should subscribe to engine events', context => {
      const {adapter, engine} = context;

      adapter.connect();

      expect(engine.on).toHaveBeenCalledWith('start', expect.any(Function));
      expect(engine.on).toHaveBeenCalledWith('pause', expect.any(Function));
      expect(engine.on).toHaveBeenCalledWith('stop', expect.any(Function));
      expect(engine.on).toHaveBeenCalledWith('time', expect.any(Function));
      expect(engine.on).toHaveBeenCalledWith('seekStart', expect.any(Function));
      expect(engine.on).toHaveBeenCalledWith(
        'seekComplete',
        expect.any(Function)
      );
      expect(engine.on).toHaveBeenCalledWith(
        'timelineChange',
        expect.any(Function)
      );
      expect(engine.on).toHaveBeenCalledWith(
        'timelineComplete',
        expect.any(Function)
      );
      expect(engine.on).toHaveBeenCalledWith(
        'timelineFirstFrame',
        expect.any(Function)
      );
      expect(engine.on).toHaveBeenCalledWith(
        'timelineRestart',
        expect.any(Function)
      );
      expect(engine.on).toHaveBeenCalledWith('duration', expect.any(Function));
    });

    test<AdapterSuiteContext>('should register eventbus listeners', context => {
      const {adapter, eventbus} = context;

      adapter.connect();

      expect(eventbus.on).toHaveBeenCalledWith(
        'timeline-play-request',
        expect.any(Function)
      );
      expect(eventbus.on).toHaveBeenCalledWith(
        'timeline-pause-request',
        expect.any(Function)
      );
      expect(eventbus.on).toHaveBeenCalledWith(
        'timeline-stop-request',
        expect.any(Function)
      );
      expect(eventbus.on).toHaveBeenCalledWith(
        'timeline-seek-request',
        expect.any(Function)
      );
      expect(eventbus.on).toHaveBeenCalledWith(
        'timeline-play-toggle-request',
        expect.any(Function)
      );
      expect(eventbus.on).toHaveBeenCalledWith(
        'request-timeline-uri',
        expect.any(Function)
      );
      // State query responders use onRequest
      expect(eventbus.onRequest).toHaveBeenCalledWith(
        'request-current-timeline-position',
        expect.any(Function)
      );
      expect(eventbus.onRequest).toHaveBeenCalledWith(
        'timeline-duration-request',
        expect.any(Function)
      );
      expect(eventbus.onRequest).toHaveBeenCalledWith(
        'timeline-container-request',
        expect.any(Function)
      );
      expect(eventbus.onRequest).toHaveBeenCalledWith(
        'request-engine-root',
        expect.any(Function)
      );
      expect(eventbus.onRequest).toHaveBeenCalledWith(
        'timeline-request-current-timeline',
        expect.any(Function)
      );
    });
  });

  describe('disconnect()', () => {
    test<AdapterSuiteContext>('should remove all listeners', context => {
      const {adapter, engine} = context;
      const unsubscribers: Array<() => void> = [];
      (engine.on as any).mockImplementation(() => {
        const unsub = vi.fn();
        unsubscribers.push(unsub);
        return unsub;
      });

      adapter.connect();
      adapter.disconnect();

      // All engine event unsubscribers should have been called
      unsubscribers.forEach(unsub => {
        expect(unsub).toHaveBeenCalled();
      });
    });
  });

  describe('eventbus → engine command forwarding', () => {
    test<AdapterSuiteContext>('timeline-play-request should call engine.start()', context => {
      const {adapter, engine, eventbus} = context;
      adapter.connect();

      eventbus.broadcast('timeline-play-request', []);

      expect(engine.start).toHaveBeenCalled();
    });

    test<AdapterSuiteContext>('timeline-pause-request should call engine.pause()', context => {
      const {adapter, engine, eventbus} = context;
      adapter.connect();

      eventbus.broadcast('timeline-pause-request', []);

      expect(engine.pause).toHaveBeenCalled();
    });

    test<AdapterSuiteContext>('timeline-stop-request should call engine.stop()', context => {
      const {adapter, engine, eventbus} = context;
      adapter.connect();

      eventbus.broadcast('timeline-stop-request', []);

      expect(engine.stop).toHaveBeenCalled();
    });

    test<AdapterSuiteContext>('timeline-seek-request should call engine.seek()', context => {
      const {adapter, engine, eventbus} = context;
      adapter.connect();

      eventbus.broadcast('timeline-seek-request', [25]);

      expect(engine.seek).toHaveBeenCalledWith(25);
    });

    test<AdapterSuiteContext>('timeline-play-toggle-request should call pause when playing', context => {
      const {adapter, engine, eventbus} = context;
      (engine as any).playState = 'playing';
      adapter.connect();

      eventbus.broadcast('timeline-play-toggle-request', []);

      expect(engine.pause).toHaveBeenCalled();
      expect(engine.start).not.toHaveBeenCalled();
    });

    test<AdapterSuiteContext>('timeline-play-toggle-request should call start when paused', context => {
      const {adapter, engine, eventbus} = context;
      (engine as any).playState = 'paused';
      adapter.connect();

      eventbus.broadcast('timeline-play-toggle-request', []);

      expect(engine.start).toHaveBeenCalled();
      expect(engine.pause).not.toHaveBeenCalled();
    });

    test<AdapterSuiteContext>('request-timeline-uri should call engine.switchTimeline()', context => {
      const {adapter, engine, eventbus} = context;
      adapter.connect();

      eventbus.broadcast('request-timeline-uri', ['new-timeline', 10]);

      expect(engine.switchTimeline).toHaveBeenCalledWith('new-timeline', 10);
    });
  });

  describe('eventbus → engine state queries', () => {
    test<AdapterSuiteContext>('request-current-timeline-position should return engine.position', context => {
      const {adapter, eventbus} = context;
      adapter.connect();

      const result = eventbus.request<number>(
        'request-current-timeline-position'
      );

      expect(result).toBe(5);
    });

    test<AdapterSuiteContext>('timeline-duration-request should return engine.duration', context => {
      const {adapter, eventbus} = context;
      adapter.connect();

      const result = eventbus.request<number>('timeline-duration-request');

      expect(result).toBe(100);
    });

    test<AdapterSuiteContext>('timeline-container-request should return engine.container', context => {
      const {adapter, eventbus, engine} = context;
      const mockContainer = {} as JQuery<HTMLElement>;
      (engine as any).container = mockContainer;
      adapter.connect();

      const result = eventbus.request<JQuery<HTMLElement>>(
        'timeline-container-request'
      );

      expect(result).toBe(mockContainer);
    });

    test<AdapterSuiteContext>('request-engine-root should return engine.engineRoot', context => {
      const {adapter, eventbus, engine} = context;
      const mockRoot = {selector: '#root'} as unknown as JQuery<HTMLElement>;
      (engine as any).engineRoot = mockRoot;
      adapter.connect();

      const result = eventbus.request<JQuery<HTMLElement>>(
        'request-engine-root'
      );

      expect(result).toBe(mockRoot);
    });

    test<AdapterSuiteContext>('timeline-request-current-timeline should return engine.currentTimelineUri', context => {
      const {adapter, eventbus} = context;
      adapter.connect();

      const result = eventbus.request<string>(
        'timeline-request-current-timeline'
      );

      expect(result).toBe('timeline-1');
    });
  });

  describe('engine → eventbus event forwarding', () => {
    test<AdapterSuiteContext>('engine start event should broadcast timeline-play', context => {
      const {adapter, engine, eventbus} = context;
      let startHandler: () => void = () => {};
      (engine.on as any).mockImplementation(
        (event: string, handler: () => void) => {
          if (event === 'start') {
            startHandler = handler;
          }
          return vi.fn();
        }
      );
      adapter.connect();

      startHandler();

      expect(eventbus.broadcast).toHaveBeenCalledWith('timeline-play', []);
    });

    test<AdapterSuiteContext>('engine pause event should broadcast timeline-pause', context => {
      const {adapter, engine, eventbus} = context;
      let pauseHandler: () => void = () => {};
      (engine.on as any).mockImplementation(
        (event: string, handler: () => void) => {
          if (event === 'pause') {
            pauseHandler = handler;
          }
          return vi.fn();
        }
      );
      adapter.connect();

      pauseHandler();

      expect(eventbus.broadcast).toHaveBeenCalledWith('timeline-pause', []);
    });

    test<AdapterSuiteContext>('engine stop event should broadcast timeline-stop', context => {
      const {adapter, engine, eventbus} = context;
      let stopHandler: () => void = () => {};
      (engine.on as any).mockImplementation(
        (event: string, handler: () => void) => {
          if (event === 'stop') {
            stopHandler = handler;
          }
          return vi.fn();
        }
      );
      adapter.connect();

      stopHandler();

      expect(eventbus.broadcast).toHaveBeenCalledWith('timeline-stop', []);
    });

    test<AdapterSuiteContext>('engine time event should broadcast timeline-time', context => {
      const {adapter, engine, eventbus} = context;
      let timeHandler: (position: number) => void = () => {};
      (engine.on as any).mockImplementation(
        (event: string, handler: (position: number) => void) => {
          if (event === 'time') {
            timeHandler = handler;
          }
          return vi.fn();
        }
      );
      adapter.connect();

      timeHandler(42);

      expect(eventbus.broadcast).toHaveBeenCalledWith('timeline-time', [42]);
    });

    test<AdapterSuiteContext>('engine seekStart event should broadcast timeline-seek', context => {
      const {adapter, engine, eventbus} = context;
      let seekStartHandler: (
        target: number,
        current: number,
        duration: number
      ) => void = () => {};
      (engine.on as any).mockImplementation((event: string, handler: any) => {
        if (event === 'seekStart') {
          seekStartHandler = handler;
        }
        return vi.fn();
      });
      adapter.connect();

      seekStartHandler(30, 10, 100);

      expect(eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-seek',
        [30, 10, 100]
      );
    });

    test<AdapterSuiteContext>('engine seekComplete event should broadcast timeline-seeked', context => {
      const {adapter, engine, eventbus} = context;
      let seekCompleteHandler: (position: number, duration: number) => void =
        () => {};
      (engine.on as any).mockImplementation((event: string, handler: any) => {
        if (event === 'seekComplete') {
          seekCompleteHandler = handler;
        }
        return vi.fn();
      });
      adapter.connect();

      seekCompleteHandler(30, 100);

      expect(eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-seeked',
        [30, 100]
      );
    });

    test<AdapterSuiteContext>('engine timelineChange event should broadcast timeline-current-timeline-change', context => {
      const {adapter, engine, eventbus} = context;
      let timelineChangeHandler: (uri: string) => void = () => {};
      (engine.on as any).mockImplementation((event: string, handler: any) => {
        if (event === 'timelineChange') {
          timelineChangeHandler = handler;
        }
        return vi.fn();
      });
      adapter.connect();

      timelineChangeHandler('new-timeline');

      expect(eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-current-timeline-change',
        ['new-timeline']
      );
    });

    test<AdapterSuiteContext>('engine timelineComplete event should broadcast timeline-complete', context => {
      const {adapter, engine, eventbus} = context;
      let completeHandler: () => void = () => {};
      (engine.on as any).mockImplementation((event: string, handler: any) => {
        if (event === 'timelineComplete') {
          completeHandler = handler;
        }
        return vi.fn();
      });
      adapter.connect();

      completeHandler();

      expect(eventbus.broadcast).toHaveBeenCalledWith('timeline-complete', []);
    });

    test<AdapterSuiteContext>('engine timelineFirstFrame event should broadcast timeline-firstframe', context => {
      const {adapter, engine, eventbus} = context;
      let firstFrameHandler: () => void = () => {};
      (engine.on as any).mockImplementation((event: string, handler: any) => {
        if (event === 'timelineFirstFrame') {
          firstFrameHandler = handler;
        }
        return vi.fn();
      });
      adapter.connect();

      firstFrameHandler();

      expect(eventbus.broadcast).toHaveBeenCalledWith(
        'timeline-firstframe',
        []
      );
    });

    test<AdapterSuiteContext>('engine timelineRestart event should broadcast timeline-restart', context => {
      const {adapter, engine, eventbus} = context;
      let restartHandler: () => void = () => {};
      (engine.on as any).mockImplementation((event: string, handler: any) => {
        if (event === 'timelineRestart') {
          restartHandler = handler;
        }
        return vi.fn();
      });
      adapter.connect();

      restartHandler();

      expect(eventbus.broadcast).toHaveBeenCalledWith('timeline-restart', []);
    });

    test<AdapterSuiteContext>('engine duration event should broadcast timeline-duration', context => {
      const {adapter, engine, eventbus} = context;
      let durationHandler: (duration: number) => void = () => {};
      (engine.on as any).mockImplementation((event: string, handler: any) => {
        if (event === 'duration') {
          durationHandler = handler;
        }
        return vi.fn();
      });
      adapter.connect();

      durationHandler(120);

      // The adapter wraps duration in a function for the eventbus callback pattern
      expect(eventbus.broadcast).toHaveBeenCalledWith('timeline-duration', [
        expect.any(Function),
      ]);
      // Verify the function returns the correct duration
      const broadcastCall = (eventbus.broadcast as any).mock.calls.find(
        (call: any[]) => call[0] === 'timeline-duration'
      );
      expect(broadcastCall[1][0]()).toBe(120);
    });
  });
});
