import {expect} from 'chai';
import type { IOperationScope } from 'operation/types.ts';
import {describe, test} from 'vitest';
import { type ISetVariableOperationData, setVariable } from '../../../operation/set-variable.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('setVariable', () => {
  test('should set the variable on the scope', () => {
    // given
    const operationData = {
      name: 'foo',
      value: 'bar'
    } as ISetVariableOperationData;
    const scope = {
      variables: {}
    } as IOperationScope;

    // test
    applyOperation(setVariable, operationData, scope);

    // expect
    expect(scope.variables?.foo).to.equal('bar');
  });

  test('should remove the name and value props from the data', () => {
    // given
    const operationData = {
      name: 'foo',
      value: 'bar'
    } as ISetVariableOperationData;
    const scope = {
      variables: {}
    } as IOperationScope;

    // test
    applyOperation(setVariable, operationData, scope);

    // expect
    expect('name' in operationData).to.be.false;
    expect('value' in operationData).to.be.false;
  });

});
