import {expect} from 'chai';
import {describe, test} from 'vitest';
import {
  calc,
  type ICalcOperationData,
  type TCalculationOperator,
} from '../../../operation/calc.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe.concurrent('calc', () => {
  test('should perform the calculations', () => {
    (['+', '-', '*', '/', '%', '**'] as TCalculationOperator[]).forEach(
      operator => {
        // given
        const left = Math.floor(Math.random() * 100) + 1;
        const right = Math.floor(Math.random() * 100) + 1;
        const operationData: ICalcOperationData = {
          left,
          right,
          operator,
        };

        // test
        const result = applyOperation(calc, operationData);

        // expect
        expect((result as any).calculationResult).to.equal(
          eval(`${left} ${operator} ${right}`)
        );
      }
    );
  });
  test('should perform calculation with resolved properties', () => {
    const operationData: ICalcOperationData = {
      left: 100,
      right: 'operationData.left',
      operator: '+',
    };

    // test
    const result = applyOperation(calc, operationData);

    // expect
    expect((result as any).calculationResult).to.equal(200);
  });
});
