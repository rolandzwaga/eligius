import { TOperationData } from '~/operation/types';
import { deepcopy } from './deepcopy';
import extractOperationDataArgumentValues from './extract-operation-data-argument-values';

export function resolvePropertyValues(operationData: TOperationData, properties: any) {
  const copy = properties !== operationData ? deepcopy(properties) : properties;
  const extract = extractOperationDataArgumentValues.bind(null, operationData);
  Object.entries(properties).forEach(([key, value]) => {
    copy[key] = extract(value);
  });
  return copy;
}
