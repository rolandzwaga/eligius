import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {IRemoveControllerFromElementOperationData} from '../../../operation/remove-controller-from-element.js';
import {removeControllerFromElement} from '../../../operation/remove-controller-from-element.js';
import {applyOperation} from '../../../util/apply-operation.js';
import {createMockEventbus} from '../../fixtures/eventbus-factory.js';
import {createMockJQueryElement} from '../../fixtures/jquery-factory.js';

describe('remove-controller-from-element operation', () => {
  let mockElement: any;
  let mockEventbus: any;
  let mockController: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockElement = createMockJQueryElement();
    mockEventbus = createMockEventbus();

    // Create mock controller
    mockController = {
      name: 'TestController',
      detach: vi.fn(),
      init: vi.fn(),
      attach: vi.fn(),
    };
  });

  it('should remove controller from element successfully', () => {
    // Attach controller to element (via data attribute)
    const controllers = [mockController];
    mockElement.data('eligiusEngineControllers', controllers);

    const operationData: IRemoveControllerFromElementOperationData = {
      selectedElement: mockElement,
      controllerName: 'TestController',
    };

    const result = applyOperation(removeControllerFromElement, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(controllers).toHaveLength(0);
    expect(result).toBe(operationData);
  });

  it('should call controller detach method', () => {
    const controllers = [mockController];
    mockElement.data('eligiusEngineControllers', controllers);

    const operationData: IRemoveControllerFromElementOperationData = {
      selectedElement: mockElement,
      controllerName: 'TestController',
    };

    applyOperation(removeControllerFromElement, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(mockController.detach).toHaveBeenCalledWith(mockEventbus);
  });

  it('should remove controllerName property from operation data', () => {
    const controllers = [mockController];
    mockElement.data('eligiusEngineControllers', controllers);

    const operationData: IRemoveControllerFromElementOperationData = {
      selectedElement: mockElement,
      controllerName: 'TestController',
    };

    const result = applyOperation(removeControllerFromElement, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus,
      operations: [],
    });

    expect('controllerName' in result).toBe(false);
  });

  it('should handle edge case when element has no controllers', () => {
    // No controllers attached
    mockElement.data('eligiusEngineControllers', undefined);

    const operationData: IRemoveControllerFromElementOperationData = {
      selectedElement: mockElement,
      controllerName: 'TestController',
    };

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const result = applyOperation(removeControllerFromElement, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "controller for name 'TestController' was not found on the given element"
    );
    expect(result).toBe(operationData);

    consoleWarnSpy.mockRestore();
  });

  it('should handle edge case when controller name does not match', () => {
    const otherController = {
      name: 'OtherController',
      detach: vi.fn(),
    };
    const controllers = [otherController];
    mockElement.data('eligiusEngineControllers', controllers);

    const operationData: IRemoveControllerFromElementOperationData = {
      selectedElement: mockElement,
      controllerName: 'NonExistentController',
    };

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    applyOperation(removeControllerFromElement, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "controller for name 'NonExistentController' was not found on the given element"
    );
    expect(otherController.detach).not.toHaveBeenCalled();
    expect(controllers).toHaveLength(1); // Controller not removed

    consoleWarnSpy.mockRestore();
  });

  it('should remove only the specified controller when multiple exist', () => {
    const controller1 = {
      name: 'Controller1',
      detach: vi.fn(),
    };
    const controller2 = {
      name: 'Controller2',
      detach: vi.fn(),
    };
    const controllers = [controller1, controller2];
    mockElement.data('eligiusEngineControllers', controllers);

    const operationData: IRemoveControllerFromElementOperationData = {
      selectedElement: mockElement,
      controllerName: 'Controller1',
    };

    applyOperation(removeControllerFromElement, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(controllers).toHaveLength(1);
    expect(controllers[0]).toBe(controller2);
    expect(controller1.detach).toHaveBeenCalledWith(mockEventbus);
    expect(controller2.detach).not.toHaveBeenCalled();
  });
});
