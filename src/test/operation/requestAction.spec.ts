import { expect } from 'chai';
import requestAction from '../../operation/requestAction';
import TimelineEventNames from '../../timeline-event-names';

class MockEventbus {
  mockAction = {};

  broadcast(eventName, args) {
    this.systemName = args[0];
    this.eventName = eventName;
    args[1](this.mockAction);
  }
}

describe('requestAction', () => {
  it('should request the specified action', () => {
    // given
    const operationData = {
      systemName: 'testActionName',
    };
    const eventbus = new MockEventbus();

    // test
    const newData = requestAction(operationData, eventbus);

    // expect
    expect(eventbus.systemName).to.equal(operationData.systemName);
    expect(eventbus.eventName).to.equal(TimelineEventNames.REQUEST_ACTION);
    expect(newData.actionInstance).to.equal(eventbus.mockAction);
  });
});
