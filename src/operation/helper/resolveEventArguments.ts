import extractOperationDataArgumentValues from './extractOperationDataArgumentValues';
import { TOperationData } from '../../action/types';

function resolveEventArguments(operationData: TOperationData, eventArgs: any[]) {
  if (!eventArgs) {
    return;
  }
  const extract = extractOperationDataArgumentValues.bind(null, operationData);
  return eventArgs.map(extract);
}

export default resolveEventArguments;
