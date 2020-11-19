import $ from 'jquery';
import { TOperationData } from '~/operation/types';
import { deepcopy } from './deepcopy';
import { extractOperationDataArgumentValues } from './extract-operation-data-argument-values';

export function resolvePropertyValues(operationData: TOperationData, properties: any) {
  const copy = properties !== operationData ? deepcopy(properties) : properties;
  const extract = extractOperationDataArgumentValues.bind(null, operationData);

  resolveProperties(properties, copy, extract);

  return copy;
}

function resolveProperties(source: any, copy: any, extract: (input: string) => any) {
  Object.entries(source).forEach(([key, value]) => {
    if (value instanceof $) {
      return;
    }
    if (typeof value === 'string') {
      copy[key] = extract(value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index, arr) => {
        if (typeof item === 'string') {
          arr[index] = extract(item);
        } else {
          resolveProperties(item, item, extract);
        }
      });
    } else if (typeof value === 'object') {
      resolveProperties(value, value, extract);
    }
  });
}
