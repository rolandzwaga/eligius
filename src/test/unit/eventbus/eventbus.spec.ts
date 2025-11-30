import type {EventName} from '@eventbus/events/types.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';

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
});
