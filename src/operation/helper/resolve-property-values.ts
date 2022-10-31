import $ from 'jquery';
import { TOperationData } from '../../operation/types';
import { deepCopy } from './deep-copy';
import { resolveOperationOrGlobalDataPropertyChain } from './resolve-operation-or-global-data-property-chain';

const cache: any[] = [];

export function resolvePropertyValues<T extends TOperationData>(
  operationData: T,
  properties: Record<string, any>
): T {
  const copy = properties !== operationData ? deepCopy(properties) : properties;
  const resolvePropertyChain = resolveOperationOrGlobalDataPropertyChain.bind(
    null,
    operationData
  );

  resolveProperties(properties, copy, resolvePropertyChain);

  return copy as T;
}

function resolveProperties(
  properties: Record<string, any>,
  copy: Record<string, any>,
  resolvePropertyChain: (propertyChain: string) => any
) {
  // Prevent recursive looping
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
        copy[key] = resolvePropertyChain(value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index, arr) => {
          if (typeof item === 'string') {
            arr[index] = resolvePropertyChain(item);
          } else {
            resolveProperties(item, item, resolvePropertyChain);
          }
        });
      } else if (typeof value === 'object') {
        resolveProperties(value, value, resolvePropertyChain);
      }
    });
  } finally {
    const index = cache.indexOf(properties);
    cache.splice(index, 1);
  }
}
