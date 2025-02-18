import { expect } from 'chai';
import { suite } from 'uvu';
import { requestAction } from '../../../operation/request-action.ts';
import { TimelineEventNames } from '../../../timeline-event-names.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

class MockEventbus {
  mockAction: any = {};
  systemName: string = '';
  eventName: string = '';

  broadcast(eventName: string, args: any[]) {
    this.systemName = args[0];
    this.eventName = eventName;
    args[1](this.mockAction);
  }
}

const RequestActionSuite = suite('requestAction');

RequestActionSuite('should request the specified action', () => {
  // given
  const operationData = {
    systemName: 'testActionName',
  } as any;
  const eventbus = new MockEventbus();

  // test
  const newData: any = applyOperation(requestAction, operationData, {
    currentIndex: -1,
    eventbus: eventbus as any,
    operations: [],
  });

  // expect
  expect(eventbus.systemName).to.equal(operationData.systemName);
  expect(eventbus.eventName).to.equal(TimelineEventNames.REQUEST_ACTION);
  expect(newData.actionInstance).to.equal(eventbus.mockAction);
});

RequestActionSuite.run();
