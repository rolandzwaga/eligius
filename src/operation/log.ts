import {getGlobals} from './helper/globals.ts';
import type {TOperation} from './types.ts';


export interface ILogOperationData {
  logValue?: any;
}

/**
 * This operation logs the specified value, or, when no logValue property has been assigned
 * it will log the current operation data, global data and context to the console
 */
export const log: TOperation<ILogOperationData> = function (
  operationData: ILogOperationData
) {
  if ('logValue' in operationData) {
    console.log(operationData.logValue);
    delete operationData.logValue;
  } else {
    const globalData = getGlobals();

    console.group('Operation info');
    console.log('context', this);
    console.log('operationData', operationData);
    console.log('globalData', globalData);
    console.groupEnd();
  }
  
  return operationData;
};
