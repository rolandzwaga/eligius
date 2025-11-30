import type {IOperationScope} from '@operation/types.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('applyOperation', () => {
  test('should apply the operation with the given scope and data', () => {
    // given
    const operationData = {applied: false};
    function testOperation(this: IOperationScope, data: {applied: boolean}) {
      data.applied = true;
      return data;
    }

    // test
    const newOperationData = applyOperation<typeof testOperation>(
      testOperation,
      operationData
    );

    // expect
    expect(newOperationData.applied).toBe(true);
  });
});
