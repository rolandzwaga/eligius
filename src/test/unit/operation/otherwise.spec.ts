import { expect } from 'chai';
import { suite } from 'uvu';
import { otherwise } from '../../../operation';
import { applyOperation } from '../../../util/apply-operation';

const OtherwiseSuite = suite('otherwise');

OtherwiseSuite('should set newIndex to undefined when it is false', () => {
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

OtherwiseSuite('should do nothing when whenEvaluation is true', () => {
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

OtherwiseSuite.run();
