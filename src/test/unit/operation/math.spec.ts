import {EndableAction} from '@action/endable-action.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
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
      expect(result.mathResult).not.toBeUndefined();
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

describe('math input resolution', () => {
  test('given an operationData whose actionInstance is an EndableAction with a start operation configured as {selector: $operationdata.panelSelector}, when math runs with {functionName: max, args: [1,2]}, then the action startOperations[0].operationData.selector is still $operationdata.panelSelector', () => {
    // given
    const actionInstance = new EndableAction(
      'ShowPanel',
      [
        {
          id: '1',
          systemName: 'selectElement',
          operationData: {selector: '$operationdata.panelSelector'},
          instance: (data: any) => data,
        },
      ],
      [],
      new Eventbus()
    );

    // test
    const result = applyOperation(math, {
      functionName: 'max',
      args: [1, 2],
      actionInstance,
    } as any);

    // expect
    expect(result.mathResult).toBe(2);
    expect(actionInstance.startOperations[0].operationData.selector).toBe(
      '$operationdata.panelSelector'
    );
  });

  test('given args with a property chain, when math runs, then the chain is resolved', () => {
    const result = applyOperation(math, {
      functionName: 'max',
      args: [1, '$operationdata.value'],
      value: 5,
    } as any);

    expect(result.mathResult).toBe(5);
  });

  test.each(['nope', 'PI', 'constructor', 'toString'])(
    'given functionName %s, when math runs, then it throws naming math',
    functionName => {
      expect(() =>
        applyOperation(math, {functionName, args: [1]} as any)
      ).toThrow(`math: unknown function '${functionName}'`);
    }
  );
});
