import { expect } from 'chai';
import { broadcastEvent } from '../../../operation/broadcast-event';
import { applyOperation } from './apply-operation';

class MockEventbus {
  eventName: string = '';
  eventTopic: string = '';
  eventArgs: any;

  broadcast(eventName: string, eventArgs: any) {
    this.eventName = eventName;
    this.eventArgs = eventArgs;
  }

  broadcastForTopic(eventName: string, eventTopic: string, eventArgs: any) {
    this.eventName = eventName;
    this.eventArgs = eventArgs;
    this.eventTopic = eventTopic;
  }
}

describe('broadcastEvent', () => {
  it('should broadcast the event through the given eventbus and clean up the operationdata', () => {
    // given
    const operationData = {
      eventArgs: null,
      eventTopic: null,
      eventName: 'testEvent',
    };
    const eventbus = new MockEventbus();

    // test
    const resultOperationData = applyOperation<typeof operationData>(
      broadcastEvent,
      operationData,
      {
        currentIndex: -1,
        eventbus: eventbus as any,
      }
    );

    // expect
    expect(eventbus.eventName).to.be.equal('testEvent');
    expect(resultOperationData.eventArgs).to.be.undefined;
    expect(resultOperationData.eventTopic).to.be.undefined;
    expect(resultOperationData.eventName).to.be.undefined;
  });

  it('should broadcast the event through the given eventbus using the given topic and clean up the operationdata', () => {
    // given
    const operationData = {
      eventArgs: null,
      eventTopic: 'testTopic',
      eventName: 'testEvent',
    };
    const eventbus = new MockEventbus();

    // test
    const resultOperationData = applyOperation<typeof operationData>(
      broadcastEvent,
      operationData,
      {
        currentIndex: -1,
        eventbus: eventbus as any,
      }
    );

    // expect
    expect(eventbus.eventName).to.be.equal('testEvent');
    expect(eventbus.eventTopic).to.be.equal('testTopic');
    expect(resultOperationData.eventArgs).to.be.undefined;
    expect(resultOperationData.eventTopic).to.be.undefined;
    expect(resultOperationData.eventName).to.be.undefined;
  });

  it('should broadcast the event using the specified arguments', () => {
    // given
    const args = ['arg1', 'arg2'];
    const operationData = {
      eventArgs: args,
      eventTopic: 'testTopic',
      eventName: 'testEvent',
    };
    const eventbus = new MockEventbus();

    // test
    const resultOperationData = applyOperation<typeof operationData>(
      broadcastEvent,
      operationData,
      {
        currentIndex: -1,
        eventbus: eventbus as any,
      }
    );

    // expect
    expect(eventbus.eventName).to.be.equal('testEvent');
    expect(eventbus.eventTopic).to.be.equal('testTopic');
    expect(eventbus.eventArgs).to.have.all.members(args);
    expect(resultOperationData.eventArgs).to.be.undefined;
    expect(resultOperationData.eventTopic).to.be.undefined;
    expect(resultOperationData.eventName).to.be.undefined;
  });

  it('should broadcast the event using the resolved arguments', () => {
    // given
    const args = ['operationdata.arg1', 'operationdata.arg2'];
    const operationData = {
      arg1: 'resolved1',
      arg2: 'resolved2',
      eventArgs: args,
      eventTopic: 'testTopic',
      eventName: 'testEvent',
    };
    const eventbus = new MockEventbus();

    // test
    const resultOperationData = applyOperation<typeof operationData>(
      broadcastEvent,
      operationData,
      {
        currentIndex: -1,
        eventbus: eventbus as any,
      }
    );

    // expect
    expect(eventbus.eventName).to.be.equal('testEvent');
    expect(eventbus.eventTopic).to.be.equal('testTopic');
    expect(eventbus.eventArgs).to.have.all.members(['resolved1', 'resolved2']);
    expect(resultOperationData.eventArgs).to.be.undefined;
    expect(resultOperationData.eventTopic).to.be.undefined;
    expect(resultOperationData.eventName).to.be.undefined;
  });
});
