import {getGlobals} from './helper/globals.ts';
import type {TOperation} from './types.ts';


export interface ILogOperationData {
  /**
   * @type=ParameterType:object|ParameterType:string|ParameterType:number|ParameterType:boolean|ParameterType:array
   * @erased
   */
  logValue?: any;
  /**
   * @erased
   */
  logName?: string;
}

/**
 * This operation logs the specified value, or, when no logValue property has been assigned
 * it will log the current operation data, global data and scope to the console
 */
export const log: TOperation<ILogOperationData, Omit<ILogOperationData, 'logValue'|'logName'>> = function (
  operationData: ILogOperationData
) {
  if ('logValue' in operationData) {
    console.log(operationData.logName ?? 'logValue', operationData.logValue);
    delete operationData.logValue;
    delete operationData.logName;
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
