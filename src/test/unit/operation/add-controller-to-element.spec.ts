import {addControllerToElement} from '@operation/add-controller-to-element.ts';
import {detachControllersWithin} from '@operation/helper/detach-controllers-within.ts';
import {getElementControllers} from '@operation/helper/get-element-data.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {beforeEach, describe, expect, test, vi} from 'vitest';

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

  describe('registration on the element', () => {
    function createController(attach: () => any) {
      return {
        name: 'TestController',
        init: vi.fn(),
        attach: vi.fn(attach),
        detach: vi.fn(),
      };
    }

    beforeEach(() => {
      document.body.innerHTML = '<div id="target"></div>';
    });

    test('given a controller whose init throws, when addControllerToElement runs, then the controller is not registered on the element', () => {
      // given
      const controller = createController(() => undefined);
      controller.init.mockImplementation(() => {
        throw new Error('init failed');
      });

      // test & expect
      expect(() =>
        applyOperation(addControllerToElement, {
          selectedElement: $('#target'),
          controllerInstance: controller,
        })
      ).toThrow('init failed');
      expect(getElementControllers($('#target')) ?? []).toEqual([]);
    });

    test('given a controller whose attach throws, when addControllerToElement runs, then the controller is not registered and detaching the element does not detach it', () => {
      // given
      const controller = createController(() => {
        throw new Error('attach failed');
      });

      // test
      expect(() =>
        applyOperation(addControllerToElement, {
          selectedElement: $('#target'),
          controllerInstance: controller,
        })
      ).toThrow('attach failed');

      // expect
      expect(getElementControllers($('#target')) ?? []).toEqual([]);
      detachControllersWithin($('#target'), {} as any);
      expect(controller.detach).not.toHaveBeenCalled();
    });

    test('given a controller whose async attach rejects, when addControllerToElement runs, then it is registered while pending and removed when the promise rejects', async () => {
      // given
      let rejectAttach: (error: Error) => void = () => {};
      const controller = createController(
        () =>
          new Promise((_resolve, reject) => {
            rejectAttach = reject;
          })
      );

      // test
      const result = applyOperation(addControllerToElement, {
        selectedElement: $('#target'),
        controllerInstance: controller,
      }) as unknown as Promise<unknown>;
      expect(getElementControllers($('#target'))).toEqual([controller]);
      rejectAttach(new Error('lottie-web missing'));

      // expect
      await expect(result).rejects.toThrow('lottie-web missing');
      expect(getElementControllers($('#target'))).toEqual([]);
    });

    test('given a controller whose async attach resolves, when addControllerToElement runs, then it stays registered', async () => {
      // given
      const controller = createController(() => Promise.resolve({}));

      // test
      await applyOperation(addControllerToElement, {
        selectedElement: $('#target'),
        controllerInstance: controller,
      });

      // expect
      expect(getElementControllers($('#target'))).toEqual([controller]);
    });

    test('given a controller whose sync attach succeeds, when addControllerToElement runs, then it is registered after init and attach', () => {
      // given
      const order: string[] = [];
      const selectedElement = $('#target');
      const controller = createController(() => {
        order.push(
          `attach:${(getElementControllers(selectedElement) ?? []).length}`
        );
      });
      controller.init.mockImplementation(() => {
        order.push('init');
      });

      // test
      applyOperation(addControllerToElement, {
        selectedElement,
        controllerInstance: controller,
      });

      // expect
      expect(order).toEqual(['init', 'attach:0']);
      expect(getElementControllers(selectedElement)).toEqual([controller]);
    });
  });
});
