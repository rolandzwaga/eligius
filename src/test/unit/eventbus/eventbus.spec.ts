import { expect } from 'chai';
import { Eventbus } from '../../../eventbus';

describe('Eventbus', () => {
  let eventbus;

  beforeEach(() => {
    eventbus = new Eventbus();
  });

  it('should register an event handler and let it get called', () => {
    // given
    let called = 0;
    eventbus.on('test', (val) => {
      called += val;
    });

    // test
    eventbus.broadcast('test', [1]);

    // expect
    expect(called).to.equal(1);
  });

  it('should register an event handler once and let it get called only once', () => {
    // given
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

  it('should only call handler for specified topic', () => {
    // given
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

  it('should register and call the event interceptor', () => {
    // given
    let called = 0;
    const interceptor = {
      intercept: (args) => {
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

  it('should register and call the event interceptor for the specified topic', () => {
    // given
    let called = 0;
    let topic = 'topic';
    const interceptor = {
      intercept: (args) => {
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

  it('should register and call the event interceptor and pass the new args to the event handler', () => {
    // given
    let called1 = 0;
    let called2 = 0;
    let topic = 'topic';
    const interceptor = {
      intercept: (_args) => {
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

  it('should register and call the specified eventlistener', () => {
    // given
    let received = [];
    const topic = 'topic';
    const listener = {
      handleEvent: (eventName, eventTopic, args) => {
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
});
