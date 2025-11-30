import type {IEventbus} from '@eventbus/types.ts';
import {
  type ISelectElementOperationData,
  selectElement,
} from '@operation/select-element.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test, vi} from 'vitest';

function createMockElement(selectedElement: any) {
  return {
    find: vi.fn().mockReturnValue(selectedElement),
  };
}

function createMockEventbusWithRoot(rootElement: any) {
  return {
    broadcast: vi.fn((_eventName: string, args: any[]) => {
      args[0](rootElement);
    }),
  };
}

describe('selectElement', () => {
  test('should select the element based on the specified selector', () => {
    // given
    const selectedElement = {
      length: 1,
    };
    const mockElement = createMockElement(selectedElement);
    const eventbus = createMockEventbusWithRoot(
      mockElement
    ) as any as IEventbus;
    const operationData = {
      selector: '.testClass',
    } as any as ISelectElementOperationData;

    // test
    const newData = applyOperation(selectElement, operationData, {
      currentIndex: -1,
      eventbus,
      operations: [],
    }) as ISelectElementOperationData;

    // expect
    expect(newData.selectedElement).toBe(selectedElement);
    expect(mockElement.find).toHaveBeenCalledWith('.testClass');
  });

  test('should select the element based on the resolved selector', () => {
    // given
    const selectedElement = {
      length: 1,
    };
    const mockElement = createMockElement(selectedElement);
    const eventbus = createMockEventbusWithRoot(
      mockElement
    ) as any as IEventbus;
    const operationData = {
      selector: '$operationdata.customSelector',
      customSelector: '.testClass',
    } as any as ISelectElementOperationData;

    // test
    const newData = applyOperation(selectElement, operationData, {
      currentIndex: -1,
      eventbus,
      operations: [],
    }) as ISelectElementOperationData;

    // expect
    expect(newData.selectedElement).toBe(selectedElement);
    expect(mockElement.find).toHaveBeenCalledWith('.testClass');
  });

  test('should select the element based on the specified selector from the existing root', () => {
    // given
    const selectedElement = {
      length: 1,
    };
    const mockElement = createMockElement(selectedElement);
    const operationData = {
      selector: '.testClass',
      useSelectedElementAsRoot: true,
      selectedElement: mockElement as any as JQuery,
    } as any as ISelectElementOperationData;

    // test
    const newData = applyOperation(
      selectElement,
      operationData
    ) as ISelectElementOperationData;

    // expect
    expect(newData.selectedElement).toBe(selectedElement);
    expect(mockElement.find).toHaveBeenCalledWith('.testClass');
  });

  test('should remove the selector and useSelectedElementAsRoot from the operation data', () => {
    // given
    const selectedElement = {
      length: 1,
    };
    const mockElement = createMockElement(selectedElement);
    const operationData = {
      selector: '.testClass',
      useSelectedElementAsRoot: true,
      selectedElement: mockElement as any as JQuery,
    } as any as ISelectElementOperationData;

    // test
    const newData = applyOperation(
      selectElement,
      operationData
    ) as ISelectElementOperationData;

    // expect
    expect('selector' in newData).toBe(false);
    expect('useSelectedElementAsRoot' in newData).toBe(false);
  });

  test('should throw error when selector is empty string', () => {
    // given
    const operationData = {
      selector: '',
    } as ISelectElementOperationData;

    // test & expect
    expect(() => applyOperation(selectElement, operationData)).toThrow(
      'selectElement: selector is either empty or not defined.'
    );
  });

  test('should throw error when selector is undefined', () => {
    // given
    const operationData = {} as ISelectElementOperationData;

    // test & expect
    expect(() => applyOperation(selectElement, operationData)).toThrow(
      'selectElement: selector is either empty or not defined.'
    );
  });
});
