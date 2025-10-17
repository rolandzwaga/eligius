import {expect} from 'chai';
import {describe, test} from 'vitest';
import type {IOperationScope} from '../../../operation/types.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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
    expect(newOperationData.applied).to.be.true;
  });
});
