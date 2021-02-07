import { expect } from 'chai';
import { requestAction } from '../operation/request-action';
import { TimelineEventNames } from '../timeline-event-names';

class MockEventbus {
  mockAction: any = {};
  systemName: string;
  eventName: string;

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
    } as any;
    const eventbus = new MockEventbus();

    // test
    const newData: any = requestAction(operationData, eventbus as any);

    // expect
    expect(eventbus.systemName).to.equal(operationData.systemName);
    expect(eventbus.eventName).to.equal(TimelineEventNames.REQUEST_ACTION);
    expect(newData.actionInstance).to.equal(eventbus.mockAction);
  });
});
