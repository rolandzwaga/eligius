import {expect, describe, test} from 'vitest';
import {breakForEach} from '../../../operation/break-for-each.ts';
import type {IOperationScope} from '../../../operation/types.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('breakForEach', () => {
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

    const result = applyOperation(breakForEach, operationData, scope);

    expect(scope.newIndex).toBe(100);
    expect(result).toEqual(operationData);
  });

  test('should remove all of the loop properties from the scope', () => {
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

    applyOperation(breakForEach, operationData, scope);

    expect('loopEndIndex' in scope).toBe(false);
    expect('loopIndex' in scope).toBe(false);
    expect('loopLength' in scope).toBe(false);
    expect('loopStartIndex' in scope).toBe(false);
    expect('currentItem' in scope).toBe(false);
  });
});
