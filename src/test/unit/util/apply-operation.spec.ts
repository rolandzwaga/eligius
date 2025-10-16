import {expect} from 'chai';
import {describe, test} from 'vitest';
import type {IOperationContext} from '../../../operation/types.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('applyOperation', () => {
  test('should apply the operation with the given context and data', () => {
    // given
    const operationData = {applied: false};
    function testOperation(this: IOperationContext, data: {applied: boolean}) {
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
