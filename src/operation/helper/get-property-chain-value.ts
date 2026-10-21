import {assertSafePropertyChain} from '@operation/helper/assert-safe-property-chain.ts';

/**
 /**
 * Gets the value for the given property chain. A property chain is defined by a string array.
 *
 * For example, this property chain: `[mySource, subSource, element, value]` should be extracted from an object of this shape:
 * ```ts
 * const foo = {
 *   mySource: {
 *     subSource: {
 *       element: {
 *         value: 'bar'
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * The result of the invocation `getPropertyChainValue([mySource, subSource, element, value], foo)` would then yield the value `bar`.
 *
 * Chains containing a `__proto__`, `prototype` or `constructor` segment are rejected to
 * prevent prototype pollution and access to the `Function` constructor.
 *
 * @param propertyChain The chain segments. Segments may use dot or bracket notation themselves.
 * @param sourceObject The object to resolve the chain against.
 * @param operationName The operation resolving the chain, named in the error when the chain is rejected.
 * @throws When an intermediate value is null or undefined, or when the chain contains a forbidden segment.
 */
export function getPropertyChainValue(
  propertyChain: string[],
  sourceObject: Record<string, any>,
  operationName?: string
) {
  let suffix = null;

  // Expand bracket array-indices into their own chain segments so bracket and dot
  // notation are equivalent: `eventArgs[0]` resolves like `eventArgs.0`, and
  // `items[2].label` like `items.2.label`. Arrays index by string key, so reading
  // `['eventArgs', '0']` returns element 0. Segments without brackets are untouched,
  // so existing dotted chains (and the `+suffix` concat below) behave exactly as before.
  const chain = propertyChain.flatMap(segment =>
    segment
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(part => part.length > 0)
  );

  assertSafePropertyChain(chain, chain.join('.'), operationName);

  const result = chain.reduce((currentInstance, prop, index) => {
    // Only null and undefined cannot be indexed; '', 0 and false are valid
    // intermediates ('' .length, (0).toFixed).
    if (currentInstance === null || currentInstance === undefined) {
      throw new Error(
        `Property chain '${chain.join('.')}' cannot be resolved.`
      );
    }

    if (index === chain.length - 1) {
      const parts = prop.split('+');
      if (parts.length > 1) {
        prop = parts[0];
        suffix = parts[1];
      }
    }
    return currentInstance[prop];
  }, sourceObject);

  return suffix ? `${result}${suffix}` : result;
}
