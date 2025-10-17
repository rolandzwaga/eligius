import {expect} from 'chai';
import {describe, test} from 'vitest';
import {type IOperationScope, otherwise } from '../../../operation/index.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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
    expect(scope.newIndex).to.be.undefined;
    expect(result).to.be.equal(operationData);
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
    expect(scope.newIndex).to.equal(0);
    expect(result).to.be.equal(operationData);
  });
});
