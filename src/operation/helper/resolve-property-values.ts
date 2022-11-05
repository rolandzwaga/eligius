import $ from 'jquery';
import { IOperationContext, TOperationData } from '../../operation/types';
import { isObject } from '../../util/guards/is-object';
import { isString } from '../../util/guards/is-string';
import { deepCopy } from './deep-copy';
import { resolveExternalPropertyChain } from './resolve-external-property-chain';

const cache: any[] = [];

/**
 * This takes a `newProperties` instance, resolves all of the properties on this object and then
 * assigns these properties to the given operationData.
 * 
 * @param operationData 
 * @param operationContext 
 * @param newProperties 
 * @returns 
 */
export function resolvePropertyValues<T extends TOperationData>(
  operationData: T,
  operationContext: IOperationContext,
  newProperties: Record<string, any>
): T {
  const copy =
    newProperties !== operationData ? deepCopy(newProperties) : newProperties;

  const resolvePropertyChain = resolveExternalPropertyChain.bind(
    null,
    operationData,
    operationContext
  );

  resolveNewProperties(newProperties, copy, resolvePropertyChain);

  return copy as T;
}

function resolveNewProperties(
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

      if (isString(value)) {
        copy[key] = resolvePropertyChain(value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index, arr) => {
          if (isString(item)) {
            arr[index] = resolvePropertyChain(item);
          } else {
            resolveNewProperties(item, item, resolvePropertyChain);
          }
        });
      } else if (isObject(value)) {
        resolveNewProperties(value, value, resolvePropertyChain);
      } else {
        copy[key] = value;
      }
    });
  } finally {
    const index = cache.indexOf(properties);
    cache.splice(index, 1);
  }
}
