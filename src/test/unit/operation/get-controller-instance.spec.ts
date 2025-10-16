import {expect} from 'chai';
import {describe, test} from 'vitest';
import type {IController} from '../../../controllers/types.ts';
import type {IEventbus} from '../../../eventbus/index.ts';
import {
  getControllerInstance,
  type IGetControllerInstanceOperationData,
} from '../../../operation/get-controller-instance.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

class MockEventbus {
  controller: any;
  eventName: string = '';
  constructor(controller: IController<any>) {
    this.controller = controller;
  }

  broadcast(_eventName: string, args: any[]) {
    this.eventName = args[0];
    args[1](this.controller);
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
    expect(eventbus.eventName).to.equal('LabelController');
    expect(newData.controllerInstance).to.equal(controller);
  });
});
