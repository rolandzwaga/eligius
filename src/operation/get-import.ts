import type {RequireKeys} from 'types.ts';
import {TimelineEventNames} from '../timeline-event-names.ts';
import type {TOperation} from './types.ts';

export interface IGetImportOperationData {
  /**
   * @type=ParameterType:systemName
   * @required
   * @erased
   */
  systemName: string;
  /**
   * @output
   */
  importedInstance?: unknown;
}

/**
 * This operation retrieves the import specified by the given `systemName` and
 * assigns it to the `importedInstance` property on the current operaton date.
 *
 * @param operationData
 *
 * @category Utility
 */
export const getImport: TOperation<
  IGetImportOperationData,
  Omit<RequireKeys<IGetImportOperationData, 'importedInstance'>, 'systemName'>
> = function (operationData: IGetImportOperationData) {
  const {systemName} = operationData;

  delete (operationData as any).systemName;

  const callBack = (instance: unknown) => {
    operationData.importedInstance = instance;
  };
  this.eventbus.broadcast(TimelineEventNames.REQUEST_FUNCTION, [
    systemName,
    callBack,
  ]);
  delete (operationData as any).systemName;
  return operationData as Omit<
    RequireKeys<IGetImportOperationData, 'importedInstance'>,
    'systemName'
  >;
};
