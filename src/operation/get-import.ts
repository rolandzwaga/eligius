import {requestRegisteredEntry} from '@operation/helper/request-registered-entry.ts';
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
 * The import is looked up with the `request-function` event, which the
 * `EngineFactory` answers from its resource importer.
 *
 * @param operationData
 * @throws Error naming the operation and the `systemName` when nothing is
 * registered under that name (with the closest registered names when the
 * importer can suggest them).
 *
 * @category Utility
 */
export const getImport: TOperation<
  IGetImportOperationData,
  Omit<RequireKeys<IGetImportOperationData, 'importedInstance'>, 'systemName'>
> = function (operationData: IGetImportOperationData) {
  const {systemName} = operationData;

  delete (operationData as any).systemName;

  operationData.importedInstance = requestRegisteredEntry(
    this.eventbus,
    'getImport',
    systemName
  );

  return operationData as Omit<
    RequireKeys<IGetImportOperationData, 'importedInstance'>,
    'systemName'
  >;
};
