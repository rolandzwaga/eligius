import {deepCopy} from '@operation/helper/deep-copy.ts';
import type {ExternalProperty} from '@operation/helper/resolve-external-property-chain.ts';
import {
  isExternalProperty,
  resolveExternalPropertyChain,
} from '@operation/helper/resolve-external-property-chain.ts';
import type {IOperationScope, TOperationData} from '@operation/types.ts';
import {isObject} from '@util/guards/is-object.ts';
import $ from 'jquery';

const cache: any[] = [];

/**
 * This takes a `newProperties` instance, resolves all of the properties on this object and then
 * assigns these properties to the given operationData.
 */
export function resolvePropertyValues<T extends TOperationData>(
  operationData: T,
  operationScope: IOperationScope,
  newProperties: Record<string, any>
): T {
  const copy =
    newProperties !== operationData ? deepCopy(newProperties) : newProperties;

  const resolvePropertyChain = resolveExternalPropertyChain.bind(
    null,
    operationData,
    operationScope
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

      // Nested values are resolved into the matching node of `copy`, never into
      // `properties`, so a separate properties object is left unmutated. When
      // `copy` is `properties` itself the nodes are identical and this resolves in place.
      if (isExternalProperty(value)) {
        copy[key] = resolvePropertyChain(value);
      } else if (Array.isArray(value)) {
        const copyArray = copy[key];
        value.forEach((item, index) => {
          if (isExternalProperty(item)) {
            copyArray[index] = resolvePropertyChain(item);
          } else if (isObject(item)) {
            resolveNewProperties(item, copyArray[index], resolvePropertyChain);
          }
        });
      } else if (isObject(value)) {
        resolveNewProperties(value, copy[key], resolvePropertyChain);
      } else {
        copy[key] = value;
      }
    });
  } finally {
    const index = cache.indexOf(properties);
    cache.splice(index, 1);
  }
}
