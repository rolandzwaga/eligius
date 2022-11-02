import { expect } from 'chai';
import { suite } from 'uvu';
import { endWhen } from '../../../operation';
import { applyOperation } from '../../../util/apply-operation';

const EndWhenSuite = suite('endWhen');

EndWhenSuite('should delete skipNextOperation from context', () => {
  // given
  const context = {
    skipNextOperation: true,
  } as any;
  const operationData = {};

  // test
  const result = applyOperation(endWhen, operationData, context);

  // expect
  expect(context.skipNextOperation).to.be.undefined;
  expect(result).to.be.equal(operationData);
});

EndWhenSuite.run();
