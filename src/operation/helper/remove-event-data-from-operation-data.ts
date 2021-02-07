import { TOperationData } from '../../operation/types';

export function removeEventDataFromOperationData(operationData: TOperationData) {
  delete operationData.eventName;
  delete operationData.eventTopic;
  delete operationData.eventArgs;
}
