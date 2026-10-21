import type {IController} from '@controllers/types.ts';
import type {IEventbus} from '@eventbus/index.ts';
import {
  getControllerInstance,
  type IGetControllerInstanceOperationData,
} from '@operation/get-controller-instance.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

class MockEventbus {
  controller: any;
  requestedTopic: string = '';
  requestedArg: string = '';
  constructor(controller: IController<any>) {
    this.controller = controller;
  }

  request(topic: string, arg: string) {
    this.requestedTopic = topic;
    this.requestedArg = arg;
    return this.controller;
  }
}

describe('getControllerInstance', () => {
  test('should get the controller instance for the given systemName', () => {
    // given
    const operationData: IGetControllerInstanceOperationData = {
      systemName: 'LabelController',
    };
    const controller = {} as IController<any>;
    const eventbus = new MockEventbus(controller);

    // test
    const newData = applyOperation(getControllerInstance, operationData, {
      currentIndex: -1,
      eventbus: eventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect(eventbus.requestedTopic).toBe('request-instance');
    expect(eventbus.requestedArg).toBe('LabelController');
    expect(newData.controllerInstance).toBe(controller);
  });

  test('should remove the systemName property from the operation data', () => {
    // given
    const operationData: IGetControllerInstanceOperationData = {
      systemName: 'LabelController',
    };
    const controller = {} as IController<any>;
    const eventbus = new MockEventbus(controller);

    // test
    const newData = applyOperation(getControllerInstance, operationData, {
      currentIndex: -1,
      eventbus: eventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect('systemName' in newData).toBe(false);
  });
});

describe('getControllerInstance with an unknown name', () => {
  const scopeWith = (request: (...args: any[]) => any) => ({
    currentIndex: -1,
    eventbus: {request} as unknown as IEventbus,
    operations: [],
  });

  test('given no responder answers, when getControllerInstance runs, then it throws naming the operation and the systemName', () => {
    expect(() =>
      applyOperation(
        getControllerInstance,
        {systemName: 'LabelControler' as any},
        scopeWith(() => undefined)
      )
    ).toThrow(
      "getControllerInstance: no controller registered for systemName 'LabelControler'"
    );
  });

  test('given the systemName is not a class, when creating it throws, then the error names getControllerInstance and keeps the cause', () => {
    // given
    const failure = new TypeError('addClass is not a constructor');

    // test
    let error: any;
    try {
      applyOperation(
        getControllerInstance,
        {systemName: 'addClass' as any},
        scopeWith(() => {
          throw failure;
        })
      );
    } catch (e) {
      error = e;
    }

    // expect
    expect(error.message).toBe(
      "getControllerInstance: could not retrieve controller 'addClass'. addClass is not a constructor"
    );
    expect(error.cause).toBe(failure);
  });
});
