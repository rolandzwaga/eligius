import { expect } from 'chai';
import { suite } from 'uvu';
import { getControllerFromElement } from '../../../operation/get-controller-from-element';
import { applyOperation } from '../../../util/apply-operation';

class MockElement {
  controllers: any[];
  constructor(controllers: any[]) {
    this.controllers = controllers;
  }

  data(_name: string) {
    return this.controllers;
  }
}

const GetControllerFromElementSuite = suite('getControllerFromElement');

GetControllerFromElementSuite(
  'should get the specified controller from the given element',
  () => {
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
      selectedElement: mockElement as any as JQuery,
      controllerName: 'testControllerName2',
    };

    // test
    const newData = applyOperation<{ controllerInstance: any }>(
      getControllerFromElement,
      operationData
    );

    // expect
    expect(newData.controllerInstance).to.equal(controllers[1]);
  }
);

GetControllerFromElementSuite.run();
