import type {IEventbus} from '@eventbus/types.ts';
import {
  type IReplaceStringOperationData,
  replaceString,
} from '@operation/replace-string.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test} from 'vitest';

describe('replaceString', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should replace string pattern', () => {
    const operationData: IReplaceStringOperationData = {
      textContent: 'Hello World',
      pattern: 'World',
      replacement: 'Universe',
      result: '',
    };
    const result = applyOperation(replaceString, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
    expect(result.result).toBe('Hello Universe');
  });

  test('should replace with regex', () => {
    const operationData: IReplaceStringOperationData = {
      textContent: 'Test 123',
      pattern: /\d+/,
      replacement: 'NUM',
      result: '',
    };
    const result = applyOperation(replaceString, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
    expect(result.result).toBe('Test NUM');
  });

  test('should throw error if textContent not provided', () => {
    const operationData: IReplaceStringOperationData = {
      textContent: null as any,
      pattern: 'test',
      replacement: 'replaced',
      result: '',
    };
    expect(() => {
      applyOperation(replaceString, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('textContent is required');
  });
});
