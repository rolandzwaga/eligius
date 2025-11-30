import {expect, beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  type ISplitStringOperationData,
  splitString,
} from '../../../operation/split-string.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('splitString', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should split string by delimiter', () => {
    const operationData: ISplitStringOperationData = {
      textContent: 'apple,banana,cherry',
      delimiter: ',',
      resultArray: [],
    };
    const result = applyOperation(splitString, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
    expect(result.resultArray).toEqual(['apple', 'banana', 'cherry']);
  });

  test('should split string with limit', () => {
    const operationData: ISplitStringOperationData = {
      textContent: 'a-b-c-d',
      delimiter: '-',
      limit: 2,
      resultArray: [],
    };
    const result = applyOperation(splitString, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
    expect(result.resultArray).toEqual(['a', 'b']);
  });

  test('should throw error if textContent not provided', () => {
    const operationData: ISplitStringOperationData = {
      textContent: null as any,
      delimiter: ',',
      resultArray: [],
    };
    expect(() => {
      applyOperation(splitString, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('textContent is required');
  });
});
