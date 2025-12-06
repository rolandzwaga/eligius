import {requestAction} from '@operation/request-action.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

class MockEventbus {
  mockAction: any = {};
  requestedTopic: string = '';
  requestedArg: string = '';

  request(topic: string, arg: string) {
    this.requestedTopic = topic;
    this.requestedArg = arg;
    return this.mockAction;
  }
}

describe('requestAction', () => {
  test('should request the specified action', () => {
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
    expect(eventbus.requestedTopic).toBe('request-action');
    expect(eventbus.requestedArg).toBe('testActionName');
    expect(newData.actionInstance).toBe(eventbus.mockAction);
  });

  test('should remove the systemName from the operation data', () => {
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
    expect('systemName' in newData).toBe(false);
  });
});
