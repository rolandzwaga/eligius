import extractOperationDataArgumentValues from './extractOperationDataArgumentValues';
import deepcopy from './deepcopy';
import { TOperationData } from '../../action/types';

function resolvePropertyValues(operationData: TOperationData, properties: any) {
  const copy = properties !== operationData ? deepcopy(properties) : properties;
  const extract = extractOperationDataArgumentValues.bind(null, operationData);
  Object.entries(properties).forEach(([key, value]) => {
    copy[key] = extract(value);
  });
  return copy;
}

export default resolvePropertyValues;
