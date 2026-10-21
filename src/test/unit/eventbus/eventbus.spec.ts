import type {EventName} from '@eventbus/events/types.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  type TestContext,
  test,
  vi,
} from 'vitest';
import type {TLanguageCode} from '@/types.ts';

type EventbusSuiteContext = {eventbus: IEventbus} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}
describe<EventbusSuiteContext>('Eventbus', () => {
  beforeEach(context => {
    withContext<EventbusSuiteContext>(context);

    context.eventbus = new Eventbus();
  });
  test<EventbusSuiteContext>('should register an event handler and let it get called', context => {
    // given
    const {eventbus} = context;

    let receivedPosition = 0;
    eventbus.on('timeline-seek-request', position => {
      receivedPosition = position;
    });

    // test
    eventbus.broadcast('timeline-seek-request', [5]);

    // expect
    expect(receivedPosition).toBe(5);
  });
  test<EventbusSuiteContext>('should register an event handler once and let it get called only once', context => {
    // given
    const {eventbus} = context;
    let callCount = 0;
    eventbus.once('timeline-seek-request', () => {
      callCount += 1;
    });

    // test
    eventbus.broadcast('timeline-seek-request', [1]);
    eventbus.broadcast('timeline-seek-request', [2]);

    // expect
    expect(callCount).toBe(1);
  });
  test<EventbusSuiteContext>('should register an event handler once, but not be called after it was removed', context => {
    // given
    const {eventbus} = context;
    let callCount = 0;
    const remover = eventbus.once('timeline-seek-request', () => {
      callCount += 1;
    });

    // test
    remover();
    eventbus.broadcast('timeline-seek-request', [1]);

    // expect
    expect(callCount).toBe(0);
  });
  test<EventbusSuiteContext>('given a handler registered with once(), when off() is called with that same handler and the event is then broadcast, then the handler is not called', context => {
    // given
    const {eventbus} = context;
    const onceHandler = vi.fn();
    eventbus.once('timeline-seek-request', onceHandler);

    // test
    eventbus.off('timeline-seek-request', onceHandler);
    eventbus.broadcast('timeline-seek-request', [1]);

    // expect
    expect(onceHandler).not.toHaveBeenCalled();
  });
  test<EventbusSuiteContext>('given a handler registered with once() for a topic, when off() is called with that handler and topic, then the handler is not called', context => {
    // given
    const {eventbus} = context;
    const onceHandler = vi.fn();
    eventbus.once('timeline-seek-request', onceHandler, 'topic-a');

    // test
    eventbus.off('timeline-seek-request', onceHandler, 'topic-a');
    eventbus.broadcastForTopic('timeline-seek-request', 'topic-a', [1]);

    // expect
    expect(onceHandler).not.toHaveBeenCalled();
  });
  test<EventbusSuiteContext>('given the same handler registered with on() and once(), when off() is called with it once, then only the earlier registration is removed', context => {
    // given
    const {eventbus} = context;
    const handler = vi.fn();
    eventbus.on('timeline-seek-request', handler);
    eventbus.once('timeline-seek-request', handler);

    // test
    eventbus.off('timeline-seek-request', handler);
    eventbus.broadcast('timeline-seek-request', [1]);
    eventbus.broadcast('timeline-seek-request', [2]);

    // expect
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(1);
  });
  test<EventbusSuiteContext>('should only call handler for specified topic', context => {
    // given
    const {eventbus} = context;
    let receivedPosition = 0;
    const topic = 'timeline-1';
    eventbus.on(
      'timeline-seek-request',
      position => {
        receivedPosition = position;
      },
      topic
    );

    // test
    eventbus.broadcast('timeline-seek-request', [1]);
    eventbus.broadcastForTopic('timeline-seek-request', topic, [5]);

    // expect
    expect(receivedPosition).toBe(5);
  });
  test<EventbusSuiteContext>('should register and call the event interceptor', context => {
    // given
    const {eventbus} = context;
    let interceptedPosition = 0;
    const interceptor = {
      intercept: (args: [number]) => {
        interceptedPosition = args[0];
        return args;
      },
    };
    eventbus.registerInterceptor('timeline-seek-request', interceptor);

    // test
    eventbus.broadcast('timeline-seek-request', [5]);
    eventbus.broadcast('timeline-play-request', []);

    // expect
    expect(interceptedPosition).toBe(5);
  });
  test<EventbusSuiteContext>('should register and not call the event interceptor after it was removed', context => {
    // given
    const {eventbus} = context;
    let callCount = 0;
    const interceptor = {
      intercept: (args: [number]) => {
        callCount += 1;
        return args;
      },
    };
    const remover = eventbus.registerInterceptor(
      'timeline-seek-request',
      interceptor
    );

    // test
    remover();
    eventbus.broadcast('timeline-seek-request', [1]);

    // expect
    expect(callCount).toBe(0);
  });
  test<EventbusSuiteContext>('should register and call the event interceptor for the specified topic', context => {
    // given
    const {eventbus} = context;
    let interceptedPosition = 0;
    const topic = 'timeline-1';
    const interceptor = {
      intercept: (args: [number]) => {
        interceptedPosition = args[0];
        return args;
      },
    };
    eventbus.registerInterceptor('timeline-seek-request', interceptor, topic);

    // test
    eventbus.broadcast('timeline-seek-request', [1]);
    eventbus.broadcastForTopic('timeline-seek-request', topic, [10]);

    // expect
    expect(interceptedPosition).toBe(10);
  });
  test<EventbusSuiteContext>('should register and call the event interceptor and pass the new args to the event handler', context => {
    // given
    const {eventbus} = context;
    let receivedGlobal = 0;
    let receivedTopic = 0;
    const topic = 'timeline-1';
    const interceptor = {
      intercept: (_args: [number]): [number] => {
        return [99];
      },
    };
    eventbus.registerInterceptor('timeline-seek-request', interceptor);
    eventbus.on('timeline-seek-request', position => {
      receivedGlobal = position;
    });
    eventbus.on(
      'timeline-seek-request',
      position => {
        receivedTopic = position;
      },
      topic
    );

    // test
    eventbus.broadcast('timeline-seek-request', [1]);
    eventbus.broadcastForTopic('timeline-seek-request', topic, [5]);

    // expect
    expect(receivedGlobal).toBe(99);
    expect(receivedTopic).toBe(5);
  });
  test<EventbusSuiteContext>('should register and call the specified eventlistener', context => {
    // given
    const {eventbus} = context;
    const received: [EventName, string | undefined, unknown[]][] = [];
    const topic = 'timeline-1';
    const listener = {
      handleEvent: (
        eventName: EventName,
        eventTopic: string | undefined,
        args: unknown[]
      ) => {
        received.push([eventName, eventTopic, args]);
      },
    };
    eventbus.registerEventlistener(listener);

    // test
    eventbus.broadcast('timeline-seek-request', [5]);
    eventbus.broadcastForTopic('timeline-play-request', topic, []);

    // expect
    expect(received.length).toBe(2);

    expect(received[0][0]).toBe('timeline-seek-request');
    expect(received[0][1]).toBeUndefined();
    expect(received[0][2][0]).toBe(5);

    expect(received[1][0]).toBe('timeline-play-request');
    expect(received[1][1]).toBe(topic);
    expect(received[1][2]).toEqual([]);
  });
  test<EventbusSuiteContext>('should register and not call the specified eventlistener after it was removed', context => {
    // given
    const {eventbus} = context;
    const received: [EventName, string | undefined, unknown[]][] = [];
    const listener = {
      handleEvent: (
        eventName: EventName,
        eventTopic: string | undefined,
        args: unknown[]
      ) => {
        received.push([eventName, eventTopic, args]);
      },
    };
    const remover = eventbus.registerEventlistener(listener);

    // test
    remover();
    eventbus.broadcast('timeline-seek-request', [1]);

    // expect
    expect(received.length).toBe(0);
  });
  test<EventbusSuiteContext>('given a once handler registered before a regular handler on the same event, when the event is broadcast once, then both handlers are called exactly once', context => {
    // given
    const {eventbus} = context;
    const onceHandler = vi.fn();
    const regularHandler = vi.fn();
    eventbus.once('timeline-seek-request', onceHandler);
    eventbus.on('timeline-seek-request', regularHandler);

    // test
    eventbus.broadcast('timeline-seek-request', [1]);

    // expect
    expect(onceHandler).toHaveBeenCalledTimes(1);
    expect(regularHandler).toHaveBeenCalledTimes(1);
  });
  test<EventbusSuiteContext>('given a handler that removes itself during dispatch, when the event is broadcast, then the next handler is still called', context => {
    // given
    const {eventbus} = context;
    const nextHandler = vi.fn();
    const remover = eventbus.on('timeline-seek-request', () => remover());
    eventbus.on('timeline-seek-request', nextHandler);

    // test
    eventbus.broadcast('timeline-seek-request', [1]);

    // expect
    expect(nextHandler).toHaveBeenCalledTimes(1);
  });
  test<EventbusSuiteContext>('given a handler that removes an earlier handler during dispatch, when the event is broadcast twice, then later handlers are still called and the removed one is not called again', context => {
    // given
    const {eventbus} = context;
    const firstHandler = vi.fn();
    const thirdHandler = vi.fn();
    eventbus.on('timeline-seek-request', firstHandler);
    eventbus.on('timeline-seek-request', () => {
      eventbus.off('timeline-seek-request', firstHandler);
    });
    eventbus.on('timeline-seek-request', thirdHandler);

    // test
    eventbus.broadcast('timeline-seek-request', [1]);
    eventbus.broadcast('timeline-seek-request', [2]);

    // expect
    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(thirdHandler).toHaveBeenCalledTimes(2);
  });
  test<EventbusSuiteContext>('given an interceptor that removes itself during dispatch and a second interceptor registered after it, when the event is broadcast twice, then the second interceptor is called both times and the first only once', context => {
    // given
    const {eventbus} = context;
    const oneShot = {
      intercept: vi.fn((args: any[]) => {
        removeOneShot();
        return args;
      }),
    };
    const second = {intercept: vi.fn((args: any[]) => args)};
    const removeOneShot = eventbus.registerInterceptor(
      'request-timeline-uri',
      oneShot
    );
    eventbus.registerInterceptor('request-timeline-uri', second);

    // test
    eventbus.broadcast('request-timeline-uri', ['a']);
    eventbus.broadcast('request-timeline-uri', ['b']);

    // expect
    expect(oneShot.intercept).toHaveBeenCalledTimes(1);
    expect(second.intercept).toHaveBeenCalledTimes(2);
  });
  test<EventbusSuiteContext>('given a listener that unregisters itself in handleEvent and a second listener, when the event is broadcast twice, then the second listener is called both times and the first only once', context => {
    // given
    const {eventbus} = context;
    const oneShot = {
      handleEvent: vi.fn(() => {
        removeOneShot();
      }),
    };
    const second = {handleEvent: vi.fn()};
    const removeOneShot = eventbus.registerEventlistener(oneShot);
    eventbus.registerEventlistener(second);

    // test
    eventbus.broadcast('timeline-play-request', []);
    eventbus.broadcast('timeline-play-request', []);

    // expect
    expect(oneShot.handleEvent).toHaveBeenCalledTimes(1);
    expect(second.handleEvent).toHaveBeenCalledTimes(2);
  });
  test<EventbusSuiteContext>('given a once handler that rebroadcasts its own event, when the event is broadcast, then the once handler runs only once', context => {
    // given
    const {eventbus} = context;
    let callCount = 0;
    eventbus.once('timeline-seek-request', () => {
      callCount += 1;
      if (callCount < 5) {
        eventbus.broadcast('timeline-seek-request', [2]);
      }
    });

    // test
    eventbus.broadcast('timeline-seek-request', [1]);

    // expect
    expect(callCount).toBe(1);
  });
  test<EventbusSuiteContext>('given a once handler that throws, when the event is broadcast twice, then the handler is not called the second time', context => {
    // given
    const {eventbus} = context;
    const throwingHandler = vi.fn(() => {
      throw new Error('boom');
    });
    eventbus.once('timeline-seek-request', throwingHandler);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // test
    eventbus.broadcast('timeline-seek-request', [1]);
    eventbus.broadcast('timeline-seek-request', [2]);

    // expect
    expect(throwingHandler).toHaveBeenCalledTimes(1);
  });

  describe('handler error isolation', () => {
    const SECRET = 'user-secret-value';

    const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve));

    test<EventbusSuiteContext>('given a handler that throws before another handler, when the event is broadcast, then the later handler is still called', context => {
      // given
      const {eventbus} = context;
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const laterHandler = vi.fn();
      eventbus.on('timeline-seek-request', () => {
        throw new Error('boom');
      });
      eventbus.on('timeline-seek-request', laterHandler);

      // test
      eventbus.broadcast('timeline-seek-request', [1]);

      // expect
      expect(laterHandler).toHaveBeenCalledWith(1);
    });

    test<EventbusSuiteContext>('given a handler that throws, when the event is broadcast, then broadcast does not throw', context => {
      // given
      const {eventbus} = context;
      vi.spyOn(console, 'error').mockImplementation(() => {});
      eventbus.on('timeline-seek-request', () => {
        throw new Error('boom');
      });

      // test + expect
      expect(() =>
        eventbus.broadcast('timeline-seek-request', [1])
      ).not.toThrow();
    });

    test<EventbusSuiteContext>('given a handler that throws, when the event is broadcast, then console.error names the event and includes the error but not the event arguments', context => {
      // given
      const {eventbus} = context;
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('boom');
      eventbus.on('timeline-seek-request', () => {
        throw error;
      });

      // test
      eventbus.broadcast('timeline-seek-request', [SECRET as any]);

      // expect
      expect(consoleError).toHaveBeenCalledTimes(1);
      const [message, ...rest] = consoleError.mock.calls[0];
      expect(message).toContain('"timeline-seek-request"');
      expect(rest).toContain(error);
      expect(JSON.stringify(consoleError.mock.calls)).not.toContain(SECRET);
    });

    test<EventbusSuiteContext>('given a topic handler that throws, when the event is broadcast for that topic, then console.error names the topic', context => {
      // given
      const {eventbus} = context;
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      eventbus.on(
        'timeline-seek-request',
        () => {
          throw new Error('boom');
        },
        'timeline-1'
      );

      // test
      eventbus.broadcastForTopic('timeline-seek-request', 'timeline-1', [1]);

      // expect
      expect(consoleError.mock.calls[0][0]).toContain('"timeline-1"');
    });

    test<EventbusSuiteContext>('given a listener that throws, when an event is broadcast, then later listeners and the handlers are still called', context => {
      // given
      const {eventbus} = context;
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const laterListener = {handleEvent: vi.fn()};
      const handler = vi.fn();
      eventbus.registerEventlistener({
        handleEvent: () => {
          throw new Error('listener boom');
        },
      });
      eventbus.registerEventlistener(laterListener);
      eventbus.on('timeline-seek-request', handler);

      // test
      expect(() =>
        eventbus.broadcast('timeline-seek-request', [1])
      ).not.toThrow();

      // expect
      expect(laterListener.handleEvent).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(1);
      expect(consoleError).toHaveBeenCalledTimes(1);
    });

    test<EventbusSuiteContext>('given an interceptor that throws, when an event is broadcast, then later interceptors run and handlers receive the arguments from before the failing interceptor', context => {
      // given
      const {eventbus} = context;
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const laterInterceptor = {intercept: vi.fn((args: any[]) => args)};
      const handler = vi.fn();
      eventbus.registerInterceptor('timeline-seek-request', {
        intercept: () => {
          throw new Error('interceptor boom');
        },
      });
      eventbus.registerInterceptor('timeline-seek-request', laterInterceptor);
      eventbus.on('timeline-seek-request', handler);

      // test
      expect(() =>
        eventbus.broadcast('timeline-seek-request', [7])
      ).not.toThrow();

      // expect
      expect(laterInterceptor.intercept).toHaveBeenCalledWith([7]);
      expect(handler).toHaveBeenCalledWith(7);
    });

    test('given an onHandlerError option, when a handler throws, then the hook receives the error and the event context without the event arguments', () => {
      // given
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const onHandlerError = vi.fn();
      const eventbus = new Eventbus({onHandlerError});
      const error = new Error('boom');
      eventbus.on(
        'timeline-seek-request',
        () => {
          throw error;
        },
        'timeline-1'
      );

      // test
      eventbus.broadcastForTopic('timeline-seek-request', 'timeline-1', [
        SECRET as any,
      ]);

      // expect
      expect(onHandlerError).toHaveBeenCalledTimes(1);
      expect(onHandlerError).toHaveBeenCalledWith(error, {
        eventName: 'timeline-seek-request',
        eventTopic: 'timeline-1',
        source: 'handler',
      });
    });

    test('given an onHandlerError option, when a component calls reportError, then it is logged naming the source and the hook receives it as a reported error', () => {
      // given
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const onHandlerError = vi.fn();
      const eventbus = new Eventbus({onHandlerError});
      const error = new Error('action failed');

      // test
      eventbus.reportError(error, {
        source: 'DOMEventListenerController',
        eventName: 'click',
      });
      eventbus.reportError('plain', {source: 'OtherController'});

      // expect
      expect(consoleError).toHaveBeenNthCalledWith(
        1,
        'Error reported by DOMEventListenerController for "click":',
        error
      );
      expect(consoleError).toHaveBeenNthCalledWith(
        2,
        'Error reported by OtherController:',
        'plain'
      );
      expect(onHandlerError).toHaveBeenNthCalledWith(1, error, {
        eventName: 'click',
        eventTopic: undefined,
        source: 'reported',
        reporter: 'DOMEventListenerController',
      });
      expect(onHandlerError).toHaveBeenNthCalledWith(2, 'plain', {
        eventName: '',
        eventTopic: undefined,
        source: 'reported',
        reporter: 'OtherController',
      });
    });

    test('given an onHandlerError hook that throws, when reportError is called, then the hook error is logged and reportError does not throw', () => {
      // given
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const hookError = new Error('hook failed');
      const eventbus = new Eventbus({
        onHandlerError: () => {
          throw hookError;
        },
      });

      // test + expect
      expect(() =>
        eventbus.reportError(new Error('x'), {source: 'SomeController'})
      ).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('onHandlerError'),
        hookError
      );
    });

    test('given an onHandlerError option, when an interceptor and a listener throw, then the hook reports each with its source', () => {
      // given
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const onHandlerError = vi.fn();
      const eventbus = new Eventbus({onHandlerError});
      eventbus.registerInterceptor('timeline-seek-request', {
        intercept: () => {
          throw new Error('interceptor boom');
        },
      });
      eventbus.registerEventlistener({
        handleEvent: () => {
          throw new Error('listener boom');
        },
      });

      // test
      eventbus.broadcast('timeline-seek-request', [1]);

      // expect
      expect(onHandlerError.mock.calls.map(call => call[1].source)).toEqual([
        'interceptor',
        'listener',
      ]);
    });

    test('given an onHandlerError hook that throws, when a handler throws, then broadcast does not throw and both errors are logged', () => {
      // given
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const eventbus = new Eventbus({
        onHandlerError: () => {
          throw new Error('hook boom');
        },
      });
      const laterHandler = vi.fn();
      eventbus.on('timeline-seek-request', () => {
        throw new Error('boom');
      });
      eventbus.on('timeline-seek-request', laterHandler);

      // test
      expect(() =>
        eventbus.broadcast('timeline-seek-request', [1])
      ).not.toThrow();

      // expect
      expect(laterHandler).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledTimes(2);
    });

    test('given an onHandlerError option, when clear() is called, then the hook still receives handler errors', () => {
      // given
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const onHandlerError = vi.fn();
      const eventbus = new Eventbus({onHandlerError});
      eventbus.clear();
      eventbus.on('timeline-seek-request', () => {
        throw new Error('boom');
      });

      // test
      eventbus.broadcast('timeline-seek-request', [1]);

      // expect
      expect(onHandlerError).toHaveBeenCalledTimes(1);
    });

    test('given an async handler that rejects, when the event is broadcast, then the rejection is reported to console.error and the hook', async () => {
      // given
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const onHandlerError = vi.fn();
      const eventbus = new Eventbus({onHandlerError});
      const error = new Error('async boom');
      eventbus.on('timeline-seek-request', async () => {
        throw error;
      });

      // test
      eventbus.broadcast('timeline-seek-request', [1]);
      await flushMicrotasks();

      // expect
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError.mock.calls[0]).toContain(error);
      expect(onHandlerError).toHaveBeenCalledWith(error, {
        eventName: 'timeline-seek-request',
        eventTopic: undefined,
        source: 'handler',
      });
    });

    test<EventbusSuiteContext>('given an async once handler that rejects, when the event is broadcast, then the rejection is reported', async context => {
      // given
      const {eventbus} = context;
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      eventbus.once('timeline-seek-request', async () => {
        throw new Error('async boom');
      });

      // test
      eventbus.broadcast('timeline-seek-request', [1]);
      await flushMicrotasks();

      // expect
      expect(consoleError).toHaveBeenCalledTimes(1);
    });

    test<EventbusSuiteContext>('given a request responder that throws, when a request is made, then the error propagates to the requester and is not logged', context => {
      // given
      const {eventbus} = context;
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      eventbus.onRequest('request-current-timeline-position', () => {
        throw new Error('responder boom');
      });

      // test + expect
      expect(() =>
        eventbus.request<number>('request-current-timeline-position')
      ).toThrow('responder boom');
      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  describe('request/onRequest', () => {
    test<EventbusSuiteContext>('given a request name declared in RequestMap, when request() is called without a type argument, then the response is typed from the map', context => {
      // given
      const {eventbus} = context;
      eventbus.onRequest('request-current-language', () => 'nl-NL');
      eventbus.onRequest('request-translation', (key, params) =>
        typeof key === 'string' ? `${key}:${params?.n}` : key.join('.')
      );

      // test
      const language = eventbus.request('request-current-language');
      const label = eventbus.request('request-translation', 'nav.home', {
        n: 1,
      });
      const custom = eventbus.request<number>('my-custom-request');

      // expect
      expectTypeOf(language).toEqualTypeOf<TLanguageCode | undefined>();
      expectTypeOf(label).toEqualTypeOf<string | undefined>();
      expectTypeOf(custom).toEqualTypeOf<number | undefined>();
      expect(language).toBe('nl-NL');
      expect(label).toBe('nav.home:1');
      expect(custom).toBeUndefined();
    });

    test<EventbusSuiteContext>('should return undefined when no responder is registered', context => {
      // given
      const {eventbus} = context;

      // test
      const result = eventbus.request<number>(
        'request-current-timeline-position'
      );

      // expect
      expect(result).toBeUndefined();
    });

    test<EventbusSuiteContext>('should return value from registered responder', context => {
      // given
      const {eventbus} = context;
      eventbus.onRequest('request-current-timeline-position', () => 42);

      // test
      const result = eventbus.request<number>(
        'request-current-timeline-position'
      );

      // expect
      expect(result).toBe(42);
    });

    test<EventbusSuiteContext>('should pass arguments to responder', context => {
      // given
      const {eventbus} = context;
      eventbus.onRequest('request-label-collection', (labelId: string) => {
        return [{id: labelId, label: 'Test', languageCode: 'en-US'}];
      });

      // test
      const result = eventbus.request<any[]>(
        'request-label-collection',
        'my-label'
      );

      // expect
      expect(result).toEqual([
        {id: 'my-label', label: 'Test', languageCode: 'en-US'},
      ]);
    });

    test<EventbusSuiteContext>('should pass multiple arguments to responder', context => {
      // given
      const {eventbus} = context;
      eventbus.onRequest('request-label-collections', (ids: string[]) => {
        return ids.map(id => [{id, label: 'Test', languageCode: 'en-US'}]);
      });

      // test
      const result = eventbus.request<any[][]>('request-label-collections', [
        'label-1',
        'label-2',
      ]);

      // expect
      expect(result).toHaveLength(2);
      expect(result![0][0].id).toBe('label-1');
      expect(result![1][0].id).toBe('label-2');
    });

    test<EventbusSuiteContext>('should return value from first responder when multiple are registered', context => {
      // given
      const {eventbus} = context;
      eventbus.onRequest('request-current-timeline-position', () => 10);
      eventbus.onRequest('request-current-timeline-position', () => 20);

      // test
      const result = eventbus.request<number>(
        'request-current-timeline-position'
      );

      // expect
      expect(result).toBe(10);
    });

    test<EventbusSuiteContext>('should not call responder after it is removed', context => {
      // given
      const {eventbus} = context;
      let callCount = 0;
      const remover = eventbus.onRequest(
        'request-current-timeline-position',
        () => {
          callCount++;
          return 42;
        }
      );

      // test
      remover();
      const result = eventbus.request<number>(
        'request-current-timeline-position'
      );

      // expect
      expect(callCount).toBe(0);
      expect(result).toBeUndefined();
    });

    test<EventbusSuiteContext>('should support topic-specific responders', context => {
      // given
      const {eventbus} = context;
      const topic = 'timeline-1';
      eventbus.onRequest('request-current-timeline-position', () => 100, topic);
      eventbus.onRequest('request-current-timeline-position', () => 200);

      // test
      const globalResult = eventbus.request<number>(
        'request-current-timeline-position'
      );
      const topicResult = eventbus.requestForTopic<number>(
        'request-current-timeline-position',
        topic
      );

      // expect
      expect(globalResult).toBe(200);
      expect(topicResult).toBe(100);
    });

    test<EventbusSuiteContext>('should allow responder to return undefined explicitly', context => {
      // given
      const {eventbus} = context;
      let wasCalled = false;
      eventbus.onRequest('timeline-container-request', () => {
        wasCalled = true;
        return undefined;
      });

      // test
      const result = eventbus.request<JQuery<HTMLElement> | undefined>(
        'timeline-container-request'
      );

      // expect
      expect(wasCalled).toBe(true);
      expect(result).toBeUndefined();
    });

    test<EventbusSuiteContext>('should be cleared when eventbus.clear() is called', context => {
      // given
      const {eventbus} = context;
      eventbus.onRequest('request-current-timeline-position', () => 42);

      // test
      eventbus.clear();
      const result = eventbus.request<number>(
        'request-current-timeline-position'
      );

      // expect
      expect(result).toBeUndefined();
    });
  });
});
