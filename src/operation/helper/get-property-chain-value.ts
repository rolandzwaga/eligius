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
 */
export function getPropertyChainValue(
  propertyChain: string[],
  sourceObject: Record<string, any>
) {
  let suffix = null;

  const result = propertyChain.reduce((currentInstance, prop, index) => {
    if (!currentInstance) {
      throw new Error(
        `Property chain '${propertyChain.join('.')}' cannot be resolved.`
      );
    }

    if (index === propertyChain.length - 1) {
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
