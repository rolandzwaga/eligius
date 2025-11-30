import {vi} from 'vitest';

/**
 * Creates a mock action for testing controllers
 * Implements the IAction interface with vi.fn() mocks
 */
export function createMockAction(actionName = 'mockAction') {
  return {
    name: actionName,
    startOperationData: undefined as any,
    endOperationData: undefined as any,
    start: vi.fn(function (this: any, operationData: any) {
      this.startOperationData = operationData;
      return Promise.resolve(operationData);
    }),
    end: vi.fn(function (this: any, operationData: any) {
      this.endOperationData = operationData;
      return Promise.resolve(operationData);
    }),
  };
}
