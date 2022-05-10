import { expect } from 'chai';
import { suite } from 'uvu';
import { IController } from '../../../controllers/types';
import { IEventbus } from '../../../eventbus';
import {
  getControllerInstance,
  IGetControllerInstanceOperationData,
} from '../../../operation/get-controller-instance';
import { applyOperation } from '../../../util/apply-operation';

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

const GetControllerInstanceSuite = suite('getControllerInstance');

GetControllerInstanceSuite(
  'should get the controller instance for the given systemName',
  () => {
    // given
    const operationData: IGetControllerInstanceOperationData = {
      systemName: 'LabelController',
    };
    const controller = {} as IController<any>;
    const eventbus = new MockEventbus(controller);

    // test
    const newData = applyOperation<{ controllerInstance: IController<any> }>(
      getControllerInstance,
      operationData,
      { currentIndex: -1, eventbus: eventbus as unknown as IEventbus }
    );

    // expect
    expect(eventbus.eventName).to.equal('LabelController');
    expect(newData.controllerInstance).to.equal(controller);
  }
);

GetControllerInstanceSuite(
  'should get the controller instance for the given systemName and assign it to the given property name',
  () => {
    // given
    const operationData: IGetControllerInstanceOperationData = {
      systemName: 'LabelController',
      propertyName: 'testProperty',
    };
    const controller = {} as IController<any>;
    const eventbus = new MockEventbus(controller);

    // test
    const newData = applyOperation<{ testProperty: IController<any> }>(
      getControllerInstance,
      operationData,
      { currentIndex: -1, eventbus: eventbus as unknown as IEventbus }
    );

    // expect
    expect(eventbus.eventName).to.equal('LabelController');
    expect(newData.testProperty).to.equal(controller);
  }
);
