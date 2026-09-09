import type {IEventbus} from '@eventbus/types.ts';
import {
  getFocusedElement,
  type IGetFocusedElementOperationData,
} from '@operation/get-focused-element.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test} from 'vitest';

describe('getFocusedElement', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    document.body.innerHTML = '<input id="test" />';
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should get currently focused element', () => {
    const operationData: IGetFocusedElementOperationData = {} as any;

    const result = applyOperation(getFocusedElement, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(result.focusedElement).toBeDefined();
  });
});
