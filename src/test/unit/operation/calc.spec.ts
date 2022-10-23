import { expect } from 'chai';
import { suite } from 'uvu';
import { calc, ICalcOperationData } from '../../../operation/calc';
import { applyOperation } from '../../../util/apply-operation';

const CalcSuite = suite('calc');

CalcSuite('should add the given operands', () => {
  // given
  const operationData: ICalcOperationData = {
    left: 2,
    right: 2,
    operator: '+',
  };

  // test
  const result = applyOperation<typeof operationData>(calc, operationData);

  // expect
  expect((result as any).calculationResult).to.equal(4);
});

CalcSuite('should subtract the given operands', () => {
  // given
  const operationData: ICalcOperationData = {
    left: 2,
    right: 2,
    operator: '-',
  };

  // test
  const result = applyOperation<typeof operationData>(calc, operationData);

  // expect
  expect((result as any).calculationResult).to.equal(0);
});

CalcSuite('should multiply the given operands', () => {
  // given
  const operationData: ICalcOperationData = {
    left: 4,
    right: 4,
    operator: '*',
  };

  // test
  const result = applyOperation<typeof operationData>(calc, operationData);

  // expect
  expect((result as any).calculationResult).to.equal(16);
});

CalcSuite('should divide the given operands', () => {
  // given
  const operationData: ICalcOperationData = {
    left: 10,
    right: 2,
    operator: '/',
  };

  // test
  const result = applyOperation<typeof operationData>(calc, operationData);

  // expect
  expect((result as any).calculationResult).to.equal(5);
});

CalcSuite('should calculate the modulo of the two operands', () => {
  // given
  const operationData: ICalcOperationData = {
    left: 10,
    right: 2,
    operator: '%',
  };

  // test
  const result = applyOperation<typeof operationData>(calc, operationData);

  // expect
  expect((result as any).calculationResult).to.equal(0);
});

CalcSuite('should calculate the modulo of the two operands', () => {
  // given
  const operationData: ICalcOperationData = {
    left: 11,
    right: 2,
    operator: '%',
  };

  // test
  const result = applyOperation<typeof operationData>(calc, operationData);

  // expect
  expect((result as any).calculationResult).to.equal(1);
});

CalcSuite('should calculate the exponent of the two operands', () => {
  // given
  const operationData: ICalcOperationData = {
    left: 5,
    right: 2,
    operator: '**',
  };

  // test
  const result = applyOperation<typeof operationData>(calc, operationData);

  // expect
  expect((result as any).calculationResult).to.equal(25);
});

CalcSuite.run();
