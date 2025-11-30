import {addControllerToElement} from '@operation/add-controller-to-element.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test, vi} from 'vitest';

function createMockElement() {
  const storedData: any[] = [];
  return {
    data: vi.fn((name: string, list?: any[]) => {
      if (list) {
        storedData.push(...list);
      }
      return storedData;
    }),
  };
}

function createMockController(returnPromise?: Promise<any>) {
  return {
    init: vi.fn(),
    attach: vi.fn().mockReturnValue(returnPromise),
    eventbus: undefined as any,
  };
}

describe('addControllerToElement', () => {
  test('should attach the controller without a promise result', () => {
    // given
    const mockController = createMockController();
    const operationData = {
      selectedElement: createMockElement(),
      controllerInstance: mockController,
    };
    const eventbus = {} as any;

    // test
    const data = applyOperation(addControllerToElement, operationData, {
      currentIndex: -1,
      eventbus,
      operations: [],
    });

    // expect
    expect(data).toBe(operationData);
    expect(mockController.attach).toHaveBeenCalledWith(eventbus);
  });

  test('should attach the controller with a promise result', async () => {
    // given
    const promise = Promise.resolve();
    const mockController = createMockController(promise);

    const operationData = {
      selectedElement: createMockElement(),
      controllerInstance: mockController,
    };

    // test
    const data = await applyOperation(addControllerToElement, operationData);

    // expect
    expect(data).toBe(operationData);
    expect(mockController.attach).toHaveBeenCalled();
  });
});
