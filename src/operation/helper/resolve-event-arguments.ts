import { TOperationData } from '../../action/types';
import extractOperationDataArgumentValues from './extract-operation-data-argument-values';

function resolveEventArguments(operationData: TOperationData, eventArgs: any[]) {
  if (!eventArgs) {
    return;
  }
  const extract = extractOperationDataArgumentValues.bind(null, operationData);
  return eventArgs.map(extract);
}

export default resolveEventArguments;
