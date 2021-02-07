import $ from 'jquery';
import { TOperationData } from '../../operation/types';
import { deepCopy } from './deep-copy';
import { extractOperationDataArgumentValues } from './extract-operation-data-argument-values';

const cache: any[] = [];

export function resolvePropertyValues(operationData: TOperationData, properties: any) {
  const copy = properties !== operationData ? deepCopy(properties) : properties;
  const extract = extractOperationDataArgumentValues.bind(null, operationData);

  resolveProperties(properties, copy, extract);

  return copy;
}

function resolveProperties(properties: any, copy: any, extract: (input: string) => any) {
  if (cache.indexOf(properties) > -1) {
    return;
  }
  cache.push(properties);
  try {
    Object.entries(properties).forEach(([key, value]) => {
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
  } finally {
    const index = cache.indexOf(properties);
    cache.splice(index, 1);
  }
}
