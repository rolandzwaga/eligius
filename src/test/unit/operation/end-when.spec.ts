import {expect} from 'chai';
import {describe, test} from 'vitest';
import {endWhen} from '../../../operation/index.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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
    expect(scope.whenEvaluation).to.be.undefined;
    expect(result).to.be.equal(operationData);
  });
});
