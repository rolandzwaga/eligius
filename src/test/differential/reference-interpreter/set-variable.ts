// PINNED COPY of src/operation/set-variable.ts at commit d937f6be. Do not edit.
// Reference interpreter for the differential harness of specs/007-aot-compiler
// (Phase 1: old interpreter vs optimised interpreter). Delete after Phase 4.

import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';
import {isForbiddenPropertyChainSegment} from './helper/assert-safe-property-chain.ts';
import {
  findDeclaringScope,
  findRootScope,
} from './helper/resolve-external-property-chain.ts';

export interface ISetVariableOperationData {
  /**
   * @required
   * @erased
   */
  name: string;
  /**
   * @type=ParameterType:object|ParameterType:string|ParameterType:number|ParameterType:boolean|ParameterType:array
   * @required
   * @erased
   */
  value: any;
}

/**
 * This operation sets a variable with the specified name on the scope with the specified value.
 *
 * Variables belong to the action: a variable set inside a `when` or `forEach` block is the
 * same variable outside it, so it keeps its value after `endWhen` or `endForEach`, and
 * variables set before the block can be read and changed inside it. Read variables with
 * `$scope.variables.<name>`.
 *
 * @throws When the name is `__proto__`, `prototype` or `constructor`.
 *
 * @category Data
 */
export const setVariable: TOperation<
  ISetVariableOperationData,
  Omit<ISetVariableOperationData, 'name' | 'value'>
> = function (operationData: ISetVariableOperationData) {
  const {name, value} = operationData;

  if (isForbiddenPropertyChainSegment(name)) {
    throw new Error(
      `setVariable: variable name '${name}' is not allowed. Names may not be __proto__, prototype or constructor.`
    );
  }

  // Write to the scope `$scope.variables` chains are read from, or create the
  // store on the action's root scope, so child scopes of when/forEach blocks
  // share the action's variables.
  const scope = findDeclaringScope('variables', this) ?? findRootScope(this);
  if (!scope.variables) {
    // No prototype, so a configured name never reads inherited members.
    scope.variables = Object.create(null) as Record<string, unknown>;
  }

  scope.variables[name] = value;

  removeProperties(operationData, 'name', 'value');

  return operationData;
};
