import {
  calc,
  type ICalcOperationData,
  type TCalculationOperator,
} from '@operation/calc.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('calc', () => {
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
        expect((result as any).calculationResult).toBe(
          eval(`${left} ${operator} ${right}`)
        );
      }
    );
  });
  test('should perform calculation with resolved properties', () => {
    const operationData: ICalcOperationData = {
      left: 100,
      right: '$operationData.left',
      operator: '+',
    };

    // test
    const result = applyOperation(calc, operationData);

    // expect
    expect((result as any).calculationResult).toBe(200);
  });
});

describe('calc input resolution and validation', () => {
  test('given unrelated operation data with an unresolvable property chain, when calc runs, then it neither throws nor resolves that data', () => {
    // given
    const nested = {chain: '$operationdata.a.b'};
    const operationData: any = {
      left: 1,
      right: 2,
      operator: '+',
      leftover: '$operationdata.a.b',
      nested,
    };

    // test
    const result: any = applyOperation(calc, operationData);

    // expect
    expect(result.calculationResult).toBe(3);
    expect(result.leftover).toBe('$operationdata.a.b');
    expect(result.nested).toBe(nested);
    expect(nested.chain).toBe('$operationdata.a.b');
  });

  test.each(['^', 'constructor', 'toString'])(
    'given operator %s, when calc runs, then it throws naming calc',
    operator => {
      expect(() =>
        applyOperation(calc, {left: 1, right: 2, operator} as any)
      ).toThrow(`calc: unknown operator '${operator}'`);
    }
  );
});
