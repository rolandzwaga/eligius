import { expect } from 'chai';
import getControllerFromElement from '../../operation/getControllerFromElement';

class MockElement {
  constructor(controllers) {
    this.controllers = controllers;
  }

  data(name) {
    return this.controllers;
  }
}

describe('getControllerFromElement', () => {
  it('should get the specified controller from the given element', () => {
    // given

    const controllers = [
      {
        name: 'testControllerName1',
      },
      {
        name: 'testControllerName2',
      },
    ];
    const mockElement = new MockElement(controllers);

    const operationData = {
      selectedElement: mockElement,
      controllerName: 'testControllerName2',
    };

    // test
    const newData = getControllerFromElement(operationData);

    // expect
    expect(newData.controllerInstance).to.equal(controllers[1]);
  });
});
