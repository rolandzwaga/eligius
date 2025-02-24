import { expect } from 'chai';
import { describe, test } from 'vitest';
import type { IEventbus } from '../../../eventbus/types.ts';
import {
  type ISelectElementOperationData,
  selectElement,
} from '../../../operation/select-element.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

class MockEventbus {
  rootElement: any;
  constructor(rootElement: any) {
    this.rootElement = rootElement;
  }

  broadcast(_eventName: string, args: any[]) {
    args[0](this.rootElement);
  }
}

class MockElement {
  selectedElement: any;
  selector: string = '';
  constructor(selectedElement: any) {
    this.selectedElement = selectedElement;
  }

  find(selector: string) {
    this.selector = selector;
    return this.selectedElement;
  }
}

describe.concurrent('selectElement', () => {
  test('should select the element based on the specified selector', () => {
    // given
    const selectedElement = {
      length: 1,
    };
    const mockElement = new MockElement(selectedElement);
    const eventbus = new MockEventbus(mockElement) as any as IEventbus;
    const operationData = {
      selector: '.testClass',
    } as any as ISelectElementOperationData;

    // test
    const newData = applyOperation<{ selectedElement: any }>(
      selectElement,
      operationData,
      { currentIndex: -1, eventbus, operations: [] }
    );

    // expect
    expect(newData.selectedElement).to.equal(selectedElement);
    expect(mockElement.selector).to.equal('.testClass');
  });
  test('should select the element based on the resolved selector', () => {
    // given
    const selectedElement = {
      length: 1,
    };
    const mockElement = new MockElement(selectedElement);
    const eventbus = new MockEventbus(mockElement) as any as IEventbus;
    const operationData = {
      selector: 'operationdata.customSelector',
      customSelector: '.testClass',
    } as any as ISelectElementOperationData;

    // test
    const newData = applyOperation<{ selectedElement: any }>(
      selectElement,
      operationData,
      { currentIndex: -1, eventbus, operations: [] }
    );

    // expect
    expect(newData.selectedElement).to.equal(selectedElement);
  });
  test('should select the element based on the specified selector from the existing root', () => {
    // given
    const selectedElement = {
      length: 1,
    };
    const mockElement = new MockElement(selectedElement);
    const operationData = {
      selector: '.testClass',
      useSelectedElementAsRoot: true,
      selectedElement: mockElement as any as JQuery,
    } as any as ISelectElementOperationData;

    // test
    const newData = applyOperation<{ selectedElement: any }>(
      selectElement,
      operationData
    );

    // expect
    expect(newData.selectedElement).to.equal(selectedElement);
  });
});
