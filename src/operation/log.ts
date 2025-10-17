import {getGlobals} from './helper/globals.ts';
import type {TOperation} from './types.ts';


export interface ILogOperationData {
  /**
   * @erased
   */
  logValue?: any;
}

/**
 * This operation logs the specified value, or, when no logValue property has been assigned
 * it will log the current operation data, global data and scope to the console
 */
export const log: TOperation<ILogOperationData> = function (
  operationData: ILogOperationData
) {
  if ('logValue' in operationData) {
    console.log('logValue', operationData.logValue);
    delete operationData.logValue;
  } else {
    const globalData = getGlobals();

    console.group('Operation info');
    console.log('scope', this);
    console.log('operationData', operationData);
    console.log('globalData', globalData);
    console.groupEnd();
  }
  
  return operationData;
};
