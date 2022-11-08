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
 * @param propertyChain
 * @param sourceObject
 * @returns
 */
export function getPropertyChainValue(
  propertyChain: string[],
  sourceObject: any
) {
  let currentInstance = sourceObject;
  let suffix = null;

  propertyChain.forEach((prop: string, index: number) => {
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
    currentInstance = currentInstance[prop];
  });

  return suffix ? `${currentInstance}${suffix}` : currentInstance;
}
