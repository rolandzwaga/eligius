import { expect } from 'chai';
import { beforeEach, describe, test, type TestContext } from 'vitest';
import { Eventbus, type IEventbus } from '../../../eventbus/index.ts';

type EventbusSuiteContext = { eventbus: IEventbus } & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T { }
describe.concurrent<EventbusSuiteContext>('Eventbus', () => {
  beforeEach((context) => {
    withContext<EventbusSuiteContext>(context);

    context.eventbus = new Eventbus();
  });
  test<EventbusSuiteContext>('should register an event handler and let it get called', (context) => {
    // given
    const { eventbus } = context;

    let called = 0;
    eventbus.on('test', (val) => {
      called += val;
    });

    // test
    eventbus.broadcast('test', [1]);

    // expect
    expect(called).to.equal(1);
  });
  test<EventbusSuiteContext>('should register an event handler once and let it get called only once', (context) => {
    // given
    const { eventbus } = context;
    let called = 0;
    eventbus.once('test', (val) => {
      called += val;
    });

    // test
    eventbus.broadcast('test', [1]);
    eventbus.broadcast('test', [1]);

    // expect
    expect(called).to.be.equal(1);
  });
  test<EventbusSuiteContext>('should register an event handler once, but not be called after it was removed', (context) => {
    // given
    const { eventbus } = context;
    let called = 0;
    const remover = eventbus.once('test', (val) => {
      called += val;
    });

    // test
    remover();
    eventbus.broadcast('test', [1]);

    // expect
    expect(called).to.be.equal(0);
  });
  test<EventbusSuiteContext>('should only call handler for specified topic', (context) => {
    // given
    const { eventbus } = context;
    let called = 0;
    let topic = 'topic';
    eventbus.on(
      'test',
      (val) => {
        called += val;
      },
      topic
    );

    // test
    eventbus.broadcast('test', [1]);
    eventbus.broadcastForTopic('test', topic, [1]);

    // expect
    expect(called).to.be.equal(1);
  });
  test<EventbusSuiteContext>('should register and call the event interceptor', (context) => {
    // given
    const { eventbus } = context;
    let called = 0;
    const interceptor = {
      intercept: (args: number[]) => {
        called += args[0];
        return args;
      },
    };
    eventbus.registerInterceptor('test', interceptor);

    // test
    eventbus.broadcast('test', [1]);
    eventbus.broadcast('test2', [1]);

    // expect
    expect(called).to.equal(1);
  });
  test<EventbusSuiteContext>('should register and not call the event interceptor after it was removed', (context) => {
    // given
    const { eventbus } = context;
    let called = 0;
    const interceptor = {
      intercept: (args: number[]) => {
        called += args[0];
        return args;
      },
    };
    const remover = eventbus.registerInterceptor('test', interceptor);

    // test
    remover();
    eventbus.broadcast('test', [1]);

    // expect
    expect(called).to.equal(0);
  });
  test<EventbusSuiteContext>('should register and call the event interceptor for the specified topic', (context) => {
    // given
    const { eventbus } = context;
    let called = 0;
    let topic = 'topic';
    const interceptor = {
      intercept: (args: number[]) => {
        called += args[0];
        return args;
      },
    };
    eventbus.registerInterceptor('test', interceptor, topic);

    // test
    eventbus.broadcast('test', [1]);
    eventbus.broadcastForTopic('test', topic, [1]);

    // expect
    expect(called).to.be.equal(1);
  });
  test<EventbusSuiteContext>('should register and call the event interceptor and pass the new args to the event handler', (context) => {
    // given
    const { eventbus } = context;
    let called1 = 0;
    let called2 = 0;
    let topic = 'topic';
    const interceptor = {
      intercept: (_args: unknown[]) => {
        return [10];
      },
    };
    eventbus.registerInterceptor('test', interceptor);
    eventbus.on('test', (val) => {
      called1 += val;
    });
    eventbus.on(
      'test',
      (val) => {
        called2 += val;
      },
      topic
    );

    // test
    eventbus.broadcast('test', [1]);
    eventbus.broadcastForTopic('test', topic, [1]);

    // expect
    expect(called1).to.be.equal(10);
    expect(called2).to.be.equal(1);
  });
  test<EventbusSuiteContext>('should register and call the specified eventlistener', (context) => {
    // given
    const { eventbus } = context;
    let received: [string, string, any[]][] = [];
    const topic = 'topic';
    const listener = {
      handleEvent: (eventName: string, eventTopic: string, args: any[]) => {
        received.push([eventName, eventTopic, args]);
      },
    };
    eventbus.registerEventlistener(listener);

    // test
    eventbus.broadcast('test', [1]);
    eventbus.broadcastForTopic('test2', topic, [100]);

    // expect
    expect(received.length).to.be.equal(2);

    expect(received[0][0]).to.equal('test');
    expect(received[0][1]).to.be.undefined;
    expect(received[0][2][0]).to.equal(1);

    expect(received[1][0]).to.equal('test2');
    expect(received[1][1]).to.equal(topic);
    expect(received[1][2][0]).to.equal(100);
  });
  test<EventbusSuiteContext>('should register and not call the specified eventlistener after it was removed', (context) => {
    // given
    const { eventbus } = context;
    let received: [string, string, any[]][] = [];
    const topic = 'topic';
    const listener = {
      handleEvent: (eventName: string, eventTopic: string, args: any[]) => {
        received.push([eventName, eventTopic, args]);
      },
    };
    const remover = eventbus.registerEventlistener(listener);

    // test
    remover();
    eventbus.broadcast('test', [1]);

    // expect
    expect(received.length).to.be.equal(0);
  });
});
