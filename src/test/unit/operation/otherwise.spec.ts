import {type IOperationScope, otherwise} from '@operation/index.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('otherwise', () => {
  test('should set newIndex to undefined when it is false', () => {
    // given
    const scope: IOperationScope = {
      whenEvaluation: false,
      operations: [],
    } as any;
    const operationData = {};

    // test
    const result = applyOperation(otherwise, operationData, scope);

    // expect
    expect(scope.newIndex).toBeUndefined();
    expect(result).toBe(operationData);
  });
  test('should do nothing when whenEvaluation is true', () => {
    // given
    const scope: IOperationScope = {
      whenEvaluation: true,
      operations: [],
    } as any;
    const operationData = {};

    // test
    const result = applyOperation(otherwise, operationData, scope);

    // expect
    expect(scope.newIndex).toBe(0);
    expect(result).toBe(operationData);
  });
});
