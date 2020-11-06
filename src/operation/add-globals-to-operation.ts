import { TOperation } from '../action/types';
import getGlobals from './helper/get-globals';

export interface IAddGlobalsToOperationData {
  globalProperties: string[];
}

const addGlobalsToOperation: TOperation<IAddGlobalsToOperationData> = function (operationData, _eventBus) {
  const { globalProperties } = operationData;
  const globalValues = globalProperties.reduce((prev: any, current: any) => {
    prev[current] = getGlobals(current);
    return prev;
  }, {});
  delete (operationData as any).globalProperties;
  return Object.assign(operationData, globalValues);
};

export default addGlobalsToOperation;
