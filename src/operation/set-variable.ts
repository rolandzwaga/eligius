import type {TOperation} from './types.ts';

export interface ISetVariableOperationData {
  /**
   * @required
   * @erased
   */
  name: string;
  /**
   * @required
   * @erased
   */
  value: any;
}

/**
 * This operation sets a variable with the specified name on the scope with the specified value.
 */
export const setVariable: TOperation<ISetVariableOperationData> = function (
  operationData: ISetVariableOperationData
) {
  const {name, value} = operationData;

  if (!this.variables) {
    this.variables = {};
  }

  this.variables[name] = value;

  delete (operationData as any).name;
  delete (operationData as any).value;

  return operationData;
};
