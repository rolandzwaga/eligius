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

  const result = chain.reduce((currentInstance, prop, index) => {
    if (!currentInstance) {
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
