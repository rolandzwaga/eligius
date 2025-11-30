import {
  type IMathOperationData,
  type MathFunctionKeys,
  type MathNonFunctionKeys,
  math,
} from '@operation/math.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('math', () => {
  test('should perform all the math calculations', () => {
    // given

    const funcNames: MathFunctionKeys[] = Object.getOwnPropertyNames(
      Math
    ).filter(x => Math[x as keyof Math] === 'functions') as MathFunctionKeys[];

    funcNames.forEach(functionName => {
      const argCount = (Math[functionName] as any).length;
      const args = new Array(argCount).fill(0).map(x => Math.random());
      const operationData: IMathOperationData = {
        args,
        functionName,
      };

      // test
      const result = applyOperation(math, operationData);

      // expect
      expect(result.mathResult).is.not.undefined;
      expect(isNaN(result.mathResult!)).toBe(false);
    });
  });
  test('Should resolve Math constants in args', () => {
    const intProperties: MathNonFunctionKeys[] = Object.getOwnPropertyNames(
      Math
    ).filter(
      x => typeof Math[x as keyof Math] === 'number'
    ) as MathNonFunctionKeys[];

    intProperties.forEach(propName => {
      //given
      const operationData: IMathOperationData = {
        args: [0, propName],
        functionName: 'max',
      };

      // test
      const result = applyOperation(math, operationData);

      // expect
      expect(result.mathResult).toBe(Math[propName]);
    });
  });

  test('Should remove the args and functionName properties from the operation data', () => {
    const intProperties: MathNonFunctionKeys[] = Object.getOwnPropertyNames(
      Math
    ).filter(
      x => typeof Math[x as keyof Math] === 'number'
    ) as MathNonFunctionKeys[];

    intProperties.forEach(propName => {
      //given
      const operationData: IMathOperationData = {
        args: [0, propName],
        functionName: 'max',
      };

      // test
      const newData = applyOperation(math, operationData);

      // expect
      expect('args' in newData).toBe(false);
      expect('functionName' in newData).toBe(false);
    });
  });
});
