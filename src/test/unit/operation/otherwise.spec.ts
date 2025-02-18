import { expect } from 'chai';
import { describe, test } from 'vitest';
import { otherwise } from '../../../operation/index.ts';
import { applyOperation } from '../../../util/apply-operation.ts';
describe('otherwise', () => {
  test('should set newIndex to undefined when it is false', () => {
    // given
    const context = {
      whenEvaluation: false,
      operations: [],
    } as any;
    const operationData = {};

    // test
    const result = applyOperation(otherwise, operationData, context);

    // expect
    expect(context.newIndex).to.be.undefined;
    expect(result).to.be.equal(operationData);
  });
  test('should do nothing when whenEvaluation is true', () => {
    // given
    const context = {
      whenEvaluation: true,
      operations: [],
    } as any;
    const operationData = {};

    // test
    const result = applyOperation(otherwise, operationData, context);

    // expect
    expect(context.newIndex).to.equal(0);
    expect(result).to.be.equal(operationData);
  });
});
