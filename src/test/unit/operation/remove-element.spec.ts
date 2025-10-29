import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {IRemoveElementOperationData} from '../../../operation/remove-element.js';
import {removeElement} from '../../../operation/remove-element.js';
import {applyOperation} from '../../../util/apply-operation.js';
import {createMockJQueryElement} from '../../fixtures/jquery-factory.js';

describe('remove-element operation', () => {
  let mockElement: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockElement = createMockJQueryElement();
  });

  it('should remove element from DOM successfully', () => {
    const operationData: IRemoveElementOperationData = {
      selectedElement: mockElement,
    };

    const removeSpy = vi.spyOn(mockElement, 'remove');

    const result = applyOperation(removeElement, operationData);

    expect(removeSpy).toHaveBeenCalled();
    expect(result).toBe(operationData);
  });

  it('should return operation data after removal', () => {
    const operationData: IRemoveElementOperationData = {
      selectedElement: mockElement,
    };

    const result = applyOperation(removeElement, operationData);

    expect(result).toEqual(operationData);
  });

  it('should handle element with content', () => {
    mockElement.html('Some content to be removed');

    const operationData: IRemoveElementOperationData = {
      selectedElement: mockElement,
    };

    const removeSpy = vi.spyOn(mockElement, 'remove');

    applyOperation(removeElement, operationData);

    expect(removeSpy).toHaveBeenCalled();
  });

  it('should handle element with attributes', () => {
    mockElement.attr('id', 'test-element');
    mockElement.attr('data-value', '123');

    const operationData: IRemoveElementOperationData = {
      selectedElement: mockElement,
    };

    const removeSpy = vi.spyOn(mockElement, 'remove');

    applyOperation(removeElement, operationData);

    expect(removeSpy).toHaveBeenCalled();
  });
});
