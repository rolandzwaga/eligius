import { expect } from 'chai';
import { getControllerInstance } from '~/operation/get-controller-instance';

class MockEventbus {
  controller: any;
  eventName: string;
  constructor(controller) {
    this.controller = controller;
  }

  broadcast(_eventName, args) {
    this.eventName = args[0];
    args[1](this.controller);
  }
}

describe('getControllerInstance', () => {
  it('should get the controller instance for the given systemName', () => {
    // given
    const operationData = {
      systemName: 'testName',
    };
    const controller = {};
    const eventbus = new MockEventbus(controller);

    // test
    const newData: any = getControllerInstance(operationData, eventbus as any);

    // expect
    expect(eventbus.eventName).to.equal('testName');
    expect(newData.controllerInstance).to.equal(controller);
  });

  it('should get the controller instance for the given systemName and assign it to the given property name', () => {
    // given
    const operationData = {
      systemName: 'testName',
      propertyName: 'testProperty',
    };
    const controller = {};
    const eventbus = new MockEventbus(controller);

    // test
    const newData: any = getControllerInstance(operationData, eventbus as any);

    // expect
    expect(eventbus.eventName).to.equal('testName');
    expect(newData.testProperty).to.equal(controller);
  });
});
