import { expect } from 'chai';
import { suite } from 'uvu';
import {
  calc,
  type ICalcOperationData,
  type TCalculationOperator,
} from '../../../operation/calc.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

const CalcSuite = suite('calc');

CalcSuite('should perform the calculations', () => {
  (['+', '-', '*', '/', '%', '**'] as TCalculationOperator[]).forEach(
    (operator) => {
      // given
      const left = Math.floor(Math.random() * 100) + 1;
      const right = Math.floor(Math.random() * 100) + 1;
      const operationData: ICalcOperationData = {
        left,
        right,
        operator,
      };

      // test
      const result = applyOperation<typeof operationData>(calc, operationData);

      // expect
      expect((result as any).calculationResult).to.equal(
        eval(`${left} ${operator} ${right}`)
      );
    }
  );
});

CalcSuite('should perform calculation with resolved properties', () => {
  const operationData: ICalcOperationData = {
    left: 100,
    right: 'operationData.left',
    operator: '+',
  };

  // test
  const result = applyOperation<typeof operationData>(calc, operationData);

  // expect
  expect((result as any).calculationResult).to.equal(200);
});

CalcSuite.run();
