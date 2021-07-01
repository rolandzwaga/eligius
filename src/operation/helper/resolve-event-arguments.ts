import { TOperationData } from '../../operation/types';
import { extractOperationDataArgumentValues } from './extract-operation-data-argument-values';

export function resolveEventArguments(
  operationData: TOperationData,
  eventArgs?: any[]
) {
  if (!eventArgs) {
    return;
  }
  const extract = extractOperationDataArgumentValues.bind(null, operationData);
  return eventArgs.map(extract);
}
