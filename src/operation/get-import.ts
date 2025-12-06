import type {TOperation} from '@operation/types.ts';
import type {RequireKeys} from '@/types.ts';

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

  operationData.importedInstance = this.eventbus.request<unknown>(
    'request-function',
    systemName
  );

  return operationData as Omit<
    RequireKeys<IGetImportOperationData, 'importedInstance'>,
    'systemName'
  >;
};
