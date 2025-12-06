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
