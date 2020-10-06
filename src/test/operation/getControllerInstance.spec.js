import { expect } from 'chai';
import getControllerInstance from '../../operation/getControllerInstance';

class MockEventbus {
  constructor(controller) {
    this.controller = controller;
  }

  broadcast(eventName, args) {
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
    const newData = getControllerInstance(operationData, eventbus);

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
    const newData = getControllerInstance(operationData, eventbus);

    // expect
    expect(eventbus.eventName).to.equal('testName');
    expect(newData.testProperty).to.equal(controller);
  });
});
