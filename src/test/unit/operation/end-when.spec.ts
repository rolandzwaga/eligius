import { expect } from 'chai';
import { describe, test } from 'vitest';
import { endWhen } from '../../../operation/index.ts';
import { applyOperation } from '../../../util/apply-operation.ts';
describe.concurrent('endWhen', () => {
  test('should delete whenEvaluation from context', () => {
    // given
    const context = {
      whenEvaluation: true,
    } as any;
    const operationData = {};

    // test
    const result = applyOperation(endWhen, operationData, context);

    // expect
    expect(context.whenEvaluation).to.be.undefined;
    expect(result).to.be.equal(operationData);
  });
});
