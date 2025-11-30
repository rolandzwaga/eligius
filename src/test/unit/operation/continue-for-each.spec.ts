import {continueForEach} from '@operation/continue-for-each.ts';
import type {IOperationScope} from '@operation/types.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('continueForEach', () => {
  test('should set the newindex to the loop end index', () => {
    const scope = {
      loopEndIndex: 100,
      loopIndex: 5,
      loopLength: 10,
      loopStartIndex: 10,
      currentItem: {},
    } as IOperationScope;
    const operationData = {
      foo: 'bar',
    };

    const result = applyOperation(continueForEach, operationData, scope);

    expect(scope.newIndex).toBe(100);
    expect(result).toEqual(operationData);
  });

  test('should remove the currentItem from the scope', () => {
    const scope = {
      loopEndIndex: 100,
      loopIndex: 5,
      loopLength: 10,
      loopStartIndex: 10,
      currentItem: {},
    } as IOperationScope;
    const operationData = {
      foo: 'bar',
    };

    applyOperation(continueForEach, operationData, scope);

    expect('currentItem' in scope).toBe(false);
  });
});
