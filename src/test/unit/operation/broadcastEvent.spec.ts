import { expect } from 'chai';
import { broadcastEvent } from '../../../operation/broadcast-event';

class MockEventbus {
  eventName: string;
  eventTopic: string;
  eventArgs: any;

  broadcast(eventName: string, eventArgs: any) {
    this.eventName = eventName;
    this.eventArgs = eventArgs;
  }

  broadcastForTopic(eventName, eventTopic, eventArgs) {
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
    broadcastEvent(operationData, eventbus as any);

    // expect
    expect(eventbus.eventName).to.be.equal('testEvent');
    expect(operationData.eventArgs).to.be.undefined;
    expect(operationData.eventTopic).to.be.undefined;
    expect(operationData.eventName).to.be.undefined;
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
    broadcastEvent(operationData, eventbus as any);

    // expect
    expect(eventbus.eventName).to.be.equal('testEvent');
    expect(eventbus.eventTopic).to.be.equal('testTopic');
    expect(operationData.eventArgs).to.be.undefined;
    expect(operationData.eventTopic).to.be.undefined;
    expect(operationData.eventName).to.be.undefined;
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
    broadcastEvent(operationData, eventbus as any);

    // expect
    expect(eventbus.eventName).to.be.equal('testEvent');
    expect(eventbus.eventTopic).to.be.equal('testTopic');
    expect(eventbus.eventArgs).to.have.all.members(args);
    expect(operationData.eventArgs).to.be.undefined;
    expect(operationData.eventTopic).to.be.undefined;
    expect(operationData.eventName).to.be.undefined;
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
    broadcastEvent(operationData, eventbus as any);

    // expect
    expect(eventbus.eventName).to.be.equal('testEvent');
    expect(eventbus.eventTopic).to.be.equal('testTopic');
    expect(eventbus.eventArgs).to.have.all.members(['resolved1', 'resolved2']);
    expect(operationData.eventArgs).to.be.undefined;
    expect(operationData.eventTopic).to.be.undefined;
    expect(operationData.eventName).to.be.undefined;
  });
});
