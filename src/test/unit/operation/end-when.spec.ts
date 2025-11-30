import {endWhen} from '@operation/index.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('endWhen', () => {
  test('should delete whenEvaluation from scope', () => {
    // given
    const scope = {
      whenEvaluation: true,
    } as any;
    const operationData = {};

    // test
    const result = applyOperation(endWhen, operationData, scope);

    // expect
    expect(scope.whenEvaluation).toBeUndefined();
    expect(result).toBe(operationData);
  });
});
