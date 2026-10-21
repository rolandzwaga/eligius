import {deepCopy} from '@operation/helper/deep-copy.ts';
import type {ExternalProperty} from '@operation/helper/resolve-external-property-chain.ts';
import {
  isExternalProperty,
  resolveExternalPropertyChain,
} from '@operation/helper/resolve-external-property-chain.ts';
import type {IOperationScope, TOperationData} from '@operation/types.ts';
import {isPlainObject} from '@util/guards/is-plain-object.ts';

type TResolver = (propertyChain: ExternalProperty) => unknown;

/**
 * Resolves every `$operationdata.`, `$globaldata.` and `$scope.` property chain string in
 * `newProperties` and returns the result.
 *
 * Property chains are looked for in the top-level values of `newProperties` and, recursively,
 * inside plain objects and arrays. Class instances (actions, controllers, the eventbus, ...),
 * jQuery objects, DOM nodes and other non-plain objects are left untouched and never walked.
 *
 * - When `newProperties` is a separate object, a deep copy of it is resolved and returned;
 *   `newProperties` itself is not changed.
 * - When `newProperties` is `operationData` itself, its top-level properties are replaced in
 *   place and `operationData` is returned. Nested plain objects and arrays are never mutated:
 *   one that contains a property chain is replaced by a resolved copy. So configured data and
 *   objects shared with other operations stay as they were.
 *
 * @param operationData The operation data `$operationdata` chains are resolved against.
 * @param operationScope The scope `$scope` chains are resolved against.
 * @param newProperties The properties to resolve.
 * @returns The resolved properties.
 */
export function resolvePropertyValues<T extends TOperationData>(
  operationData: T,
  operationScope: IOperationScope,
  newProperties: Record<string, any>
): T {
  const target =
    newProperties !== operationData ? deepCopy(newProperties) : newProperties;

  const resolve: TResolver = propertyChain =>
    resolveExternalPropertyChain(operationData, operationScope, propertyChain);

  const visiting = new Set<object>([target]);
  for (const key of Object.keys(target)) {
    const value = target[key];
    const resolved = resolveValue(value, resolve, visiting);
    if (resolved !== value) {
      target[key] = resolved;
    }
  }

  return target as T;
}

/**
 * Returns `value` with its property chains resolved. Plain objects and arrays that contain a
 * chain are copied (copy-on-write); everything else is returned as it is.
 */
function resolveValue(
  value: unknown,
  resolve: TResolver,
  visiting: Set<object>
): unknown {
  if (isExternalProperty(value as ExternalProperty)) {
    return resolve(value as ExternalProperty);
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  const isArray = Array.isArray(value);
  if (!isArray && !isPlainObject(value)) {
    return value;
  }
  // Prevent recursive looping on cyclic data.
  if (visiting.has(value)) {
    return value;
  }

  visiting.add(value);
  try {
    if (isArray) {
      let copy: unknown[] | undefined;
      value.forEach((item, index) => {
        const resolved = resolveValue(item, resolve, visiting);
        if (resolved !== item) {
          copy ??= value.slice();
          copy[index] = resolved;
        }
      });
      return copy ?? value;
    }

    let copy: Record<string, unknown> | undefined;
    const source = value as Record<string, unknown>;
    for (const key of Object.keys(source)) {
      const item = source[key];
      const resolved = resolveValue(item, resolve, visiting);
      if (resolved !== item) {
        copy ??= copyPlainObject(source);
        copy[key] = resolved;
      }
    }
    return copy ?? value;
  } finally {
    visiting.delete(value);
  }
}

function copyPlainObject(source: Record<string, unknown>) {
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    // defineProperty, so an own '__proto__' key stays a data property.
    Object.defineProperty(copy, key, {
      value: source[key],
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  return copy;
}
