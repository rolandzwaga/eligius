import {expect} from 'chai';
import type { IOperationContext } from 'operation/types.ts';
import {describe, test} from 'vitest';
import { type ISetVariableOperationData, setVariable } from '../../../operation/set-variable.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('setVariable', () => {
  test('should set the variable on the context', () => {
    // given
    const operationData = {
      name: 'foo',
      value: 'bar'
    } as ISetVariableOperationData;
    const context = {
      variables: {}
    } as IOperationContext;

    // test
    applyOperation(setVariable, operationData, context);

    // expect
    expect(context.variables?.foo).to.equal('bar');
  });
});
