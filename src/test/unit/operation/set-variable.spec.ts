import {
  type ISetVariableOperationData,
  setVariable,
} from '@operation/set-variable.ts';
import type {IOperationScope} from '@operation/types.ts';
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
});
