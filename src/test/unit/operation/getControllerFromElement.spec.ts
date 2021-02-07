import { expect } from 'chai';
import { getControllerFromElement } from '../operation/get-controller-from-element';

class MockElement {
  controllers: any[];
  constructor(controllers: any[]) {
    this.controllers = controllers;
  }

  data(_name: string) {
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
      selectedElement: (mockElement as any) as JQuery,
      controllerName: 'testControllerName2',
    };

    // test
    const newData: any = getControllerFromElement(operationData, {} as any);

    // expect
    expect(newData.controllerInstance).to.equal(controllers[1]);
  });
});
