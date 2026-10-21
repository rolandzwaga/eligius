import {Action} from '@action/action.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import {calc} from '@operation/calc.ts';
import {endForEach} from '@operation/end-for-each.ts';
import {endWhen} from '@operation/end-when.ts';
import {
  endForEachSystemName,
  forEach,
  forEachSystemName,
} from '@operation/for-each.ts';
import {setOperationData} from '@operation/set-operation-data.ts';
import {
  type ISetVariableOperationData,
  setVariable,
} from '@operation/set-variable.ts';
import type {IOperationScope, TOperationData} from '@operation/types.ts';
import {when} from '@operation/when.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('setVariable', () => {
  test('should set the variable on the scope', () => {
    // given
    const operationData = {
      name: 'foo',
      value: 'bar',
    } as ISetVariableOperationData;
    const scope = {
      variables: {},
    } as IOperationScope;

    // test
    applyOperation(setVariable, operationData, scope);

    // expect
    expect(scope.variables?.foo).toBe('bar');
  });

  test('should remove the name and value props from the data', () => {
    // given
    const operationData = {
      name: 'foo',
      value: 'bar',
    } as ISetVariableOperationData;
    const scope = {
      variables: {},
    } as IOperationScope;

    // test
    applyOperation(setVariable, operationData, scope);

    // expect
    expect('name' in operationData).toBe(false);
    expect('value' in operationData).toBe(false);
  });

  test.each(['__proto__', 'prototype', 'constructor'])(
    'given the variable name %s, when the operation runs, then it throws naming setVariable',
    name => {
      const scope = {} as IOperationScope;

      expect(() =>
        applyOperation(setVariable, {name, value: {polluted: true}}, scope)
      ).toThrow(`setVariable: variable name '${name}' is not allowed`);
      expect(({} as any).polluted).toBeUndefined();
    }
  );

  test('given a scope without variables, when a variable is set, then the store has no prototype', () => {
    const scope = {} as IOperationScope;

    applyOperation(setVariable, {name: 'foo', value: 1}, scope);

    expect(Object.getPrototypeOf(scope.variables)).toBeNull();
    expect(scope.variables?.foo).toBe(1);
  });
});

describe('setVariable inside when and forEach blocks', () => {
  function op(
    systemName: string,
    instance: any,
    operationData: TOperationData = {}
  ): IResolvedOperation {
    return {id: systemName, systemName, operationData, instance};
  }

  function run(operations: IResolvedOperation[]) {
    return new Action('test', operations, new Eventbus()).start();
  }

  function recordWhen(results: boolean[]) {
    return op('record', function (this: IOperationScope, data: any) {
      results.push(true);
      return data;
    });
  }

  test('given a variable flag set to 0 before a when block and set to 1 inside it, when the action runs past endWhen, then a later when on $scope.variables.flag==1 is true', async () => {
    // given
    const results: boolean[] = [];

    // test
    await run([
      op('setVariable', setVariable, {name: 'flag', value: 0}),
      op('when', when, {expression: '1==1'}),
      op('setVariable', setVariable, {name: 'flag', value: 1}),
      op('endWhen', endWhen),
      op('when', when, {expression: '$scope.variables.flag==1'}),
      recordWhen(results),
      op('endWhen', endWhen),
    ]);

    // expect
    expect(results).toEqual([true]);
  });

  test('given an outer variable, when a when block sets a different variable, then the outer variable can still be read inside the block', async () => {
    // given
    const results: boolean[] = [];

    // test
    await run([
      op('setVariable', setVariable, {name: 'y', value: 'outer'}),
      op('when', when, {expression: '1==1'}),
      op('setVariable', setVariable, {name: 'flag', value: 1}),
      op('when', when, {expression: "$scope.variables.y=='outer'"}),
      recordWhen(results),
      op('endWhen', endWhen),
      op('endWhen', endWhen),
    ]);

    // expect
    expect(results).toEqual([true]);
  });

  test('given an accumulator set before a forEach, when the loop body adds each item with calc and setVariable, then the accumulator keeps the total after endForEach', async () => {
    // given / test
    const result = await run([
      op('setVariable', setVariable, {name: 'sum', value: 0}),
      op(forEachSystemName, forEach, {collection: [1, 2, 3]}),
      op('calc', calc, {
        left: '$scope.variables.sum',
        right: '$scope.currentItem',
        operator: '+',
      }),
      op('setOperationData', setOperationData, {
        properties: {value: '$operationdata.calculationResult'},
      }),
      op('setVariable', setVariable, {name: 'sum'}),
      op(endForEachSystemName, endForEach),
      op('setOperationData', setOperationData, {
        properties: {total: '$scope.variables.sum'},
      }),
    ]);

    // expect
    expect(result.total).toBe(6);
  });
});
