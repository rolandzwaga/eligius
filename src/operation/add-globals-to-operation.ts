import { IEventbus } from '../eventbus/types';
import { getGlobals } from './helper/get-globals';
import { TOperation } from './types';

export interface IAddGlobalsToOperationData {
  globalProperties: string[];
}

export const addGlobalsToOperation: TOperation<IAddGlobalsToOperationData> = function (
  operationData: IAddGlobalsToOperationData,
  _eventBus: IEventbus
) {
  const { globalProperties } = operationData;
  const globalValues = globalProperties.reduce((prev: any, current: any) => {
    prev[current] = getGlobals(current);
    return prev;
  }, {});
  delete (operationData as any).globalProperties;
  return Object.assign(operationData, globalValues);
};
