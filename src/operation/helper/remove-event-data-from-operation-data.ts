import { TOperationData } from '../../action/types';

function removeEventDataFromOperationData(operationData: TOperationData) {
  delete operationData.eventName;
  delete operationData.eventTopic;
  delete operationData.eventArgs;
}

export default removeEventDataFromOperationData;
