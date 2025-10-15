import type {TOperationData} from '../../operation/types.ts';

export function removeEventDataFromOperationData(
  operationData: TOperationData
) {
  delete operationData.eventName;
  delete operationData.eventTopic;
  delete operationData.eventArgs;
}
