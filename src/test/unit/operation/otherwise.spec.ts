import { expect } from 'chai';
import { suite } from 'uvu';
import { otherwise } from '../../../operation';
import { applyOperation } from '../../../util/apply-operation';

const OtherwiseSuite = suite('otherwise');

OtherwiseSuite('should set skipNextOperation to true when it is false', () => {
  // given
  const context = {
    skipNextOperation: false,
  } as any;
  const operationData = {};

  // test
  const result = applyOperation(otherwise, operationData, context);

  // expect
  expect(context.skipNextOperation).to.be.true;
  expect(result).to.be.equal(operationData);
});

OtherwiseSuite('should do nothing when skipNextOperation is undefined', () => {
  // given
  const context = {
    skipNextOperation: undefined,
  } as any;
  const operationData = {};

  // test
  const result = applyOperation(otherwise, operationData, context);

  // expect
  expect(context.skipNextOperation).to.be.undefined;
  expect(result).to.be.equal(operationData);
});

OtherwiseSuite.run();
