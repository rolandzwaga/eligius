import type {TOperation} from './types.ts';

export interface ISetVariableOperationData {
  /**
   * @required
   */
  name: string;
  /**
   * @required
   */
  value: any;
}

/**
 * This operation sets a variable with the specified name on the context with the specified value.
 */
export const setVariable: TOperation<ISetVariableOperationData> = function (
  operationData: ISetVariableOperationData
) {
  const {name, value} = operationData;

  if (!this.variables) {
    this.variables = {};
  }

  this.variables[name] = value;

  return operationData;
};
