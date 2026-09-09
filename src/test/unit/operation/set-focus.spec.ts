import type {IEventbus} from '@eventbus/types.ts';
import {type ISetFocusOperationData, setFocus} from '@operation/set-focus.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {beforeEach, describe, expect, test} from 'vitest';

describe('setFocus', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    document.body.innerHTML = '';
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should set focus to element', () => {
    document.body.innerHTML = '<input id="test" type="text" />';
    const $input = $(document).find('#test');
    let focusCalled = false;
    ($input[0] as any).focus = () => {
      focusCalled = true;
    };

    const operationData: ISetFocusOperationData = {
      selectedElement: $input as any,
    };

    applyOperation(setFocus, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(focusCalled).toBe(true);
  });

  test('should throw error if selectedElement not provided', () => {
    const operationData: ISetFocusOperationData = {
      selectedElement: null as any,
    };

    expect(() => {
      applyOperation(setFocus, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('selectedElement is required');
  });
});
