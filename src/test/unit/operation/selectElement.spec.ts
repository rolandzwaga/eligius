import { expect } from 'chai';
import { IEventbus } from '../../../eventbus/types';
import {
  ISelectElementOperationData,
  selectElement,
} from '../../../operation/select-element';

class MockEventbus {
  rootElement: any;
  constructor(rootElement) {
    this.rootElement = rootElement;
  }

  broadcast(_eventName, args) {
    args[0](this.rootElement);
  }
}

class MockElement {
  selectedElement: any;
  selector: string;
  constructor(selectedElement) {
    this.selectedElement = selectedElement;
  }

  find(selector) {
    this.selector = selector;
    return this.selectedElement;
  }
}

describe('selectElement', () => {
  it('should select the element based on the specified selector', () => {
    // given
    const selectedElement = {
      length: 1,
    };
    const mockElement = new MockElement(selectedElement);
    const eventbus = (new MockEventbus(mockElement) as any) as IEventbus;
    const operationData = ({
      selector: '.testClass',
    } as any) as ISelectElementOperationData;

    // test
    const newData: any = selectElement(operationData, eventbus);

    // expect
    expect(newData.selectedElement).to.equal(selectedElement);
  });

  it('should select the element based on the specified selector from the existing root', () => {
    // given
    const selectedElement = {
      length: 1,
    };
    const mockElement = new MockElement(selectedElement);
    const operationData = ({
      selector: '.testClass',
      useSelectedElementAsRoot: true,
      selectedElement: (mockElement as any) as JQuery,
    } as any) as ISelectElementOperationData;

    // test
    const newData: any = selectElement(operationData, {} as any);

    // expect
    expect(newData.selectedElement).to.equal(selectedElement);
  });

  it('should select the element based on the specified selector from the existing root that is assigned to a specified property on the operationdata', () => {
    // given
    const selectedElement = {
      length: 1,
    };
    const mockElement = new MockElement(selectedElement);
    const operationData = {
      selector: '.testClass',
      useSelectedElementAsRoot: true,
      otherProperty: mockElement,
      propertyName: 'otherProperty',
    };

    // test
    const newData: any = selectElement(operationData, {} as any);

    // expect
    expect(newData.otherProperty).to.equal(selectedElement);
  });
});
