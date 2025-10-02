import $ from 'jquery';
import type {IOperationContext, TOperationData} from '../../operation/types.ts';
import {isObject} from '../../util/guards/is-object.ts';
import {deepCopy} from './deep-copy.ts';
import type {ExternalProperty} from './resolve-external-property-chain.ts';
import {
  isExternalProperty,
  resolveExternalPropertyChain,
} from './resolve-external-property-chain.ts';

const cache: any[] = [];

/**
 * This takes a `newProperties` instance, resolves all of the properties on this object and then
 * assigns these properties to the given operationData.
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
  resolvePropertyChain: (
    propertyChain: ExternalProperty | Record<string, any>
  ) => any
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

      if (isExternalProperty(value)) {
        copy[key] = resolvePropertyChain(value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index, arr) => {
          if (isExternalProperty(item)) {
            arr[index] = resolvePropertyChain(item);
          } else if (isObject(item)) {
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
