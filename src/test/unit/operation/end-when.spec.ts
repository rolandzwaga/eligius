import { expect } from 'chai';
import { suite } from 'uvu';
import { endWhen } from '../../../operation';
import { applyOperation } from '../../../util/apply-operation';

const EndWhenSuite = suite('endWhen');

EndWhenSuite('should delete whenEvaluation from context', () => {
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

EndWhenSuite.run();
