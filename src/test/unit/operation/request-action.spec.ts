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

describe('requestAction with an unknown name', () => {
  const scopeWith = (request: (...args: any[]) => any) => ({
    currentIndex: -1,
    eventbus: {request} as any,
    operations: [],
  });

  test('given the request-action responder answers null, when requestAction runs, then it throws naming the operation and the systemName', () => {
    expect(() =>
      applyOperation(
        requestAction,
        {systemName: 'ShowPanle'},
        scopeWith(() => null)
      )
    ).toThrow("requestAction: no action registered for systemName 'ShowPanle'");
  });

  test('given the request-action responder throws a did you mean hint, when requestAction runs, then the hint is kept and the original error is the cause', () => {
    // given
    const hint = new Error("Did you mean 'ShowPanel'?");

    // test
    let error: any;
    try {
      applyOperation(
        requestAction,
        {systemName: 'ShowPanle'},
        scopeWith(() => {
          throw hint;
        })
      );
    } catch (e) {
      error = e;
    }

    // expect
    expect(error.message).toBe(
      "requestAction: could not retrieve action 'ShowPanle'. Did you mean 'ShowPanel'?"
    );
    expect(error.cause).toBe(hint);
  });
});
