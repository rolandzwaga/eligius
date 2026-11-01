import {
  assertParsedChainSafe,
  parseSegments,
  walkChain,
} from '@operation/helper/chain-cache.ts';

export {isGlobalObject} from '@operation/helper/chain-cache.ts';

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
 * prevent prototype pollution and access to the `Function` constructor. Chains that pass
 * through or end at the global object (`window`), for example
 * `selectedElement.0.ownerDocument.defaultView`, are rejected too, so configuration cannot
 * reach `eval`, `Function`, timers or other globals.
 *
 * Bracket indices are expanded into their own segments, so `eventArgs[0]` resolves like
 * `eventArgs.0` and `items[2].label` like `items.2.label`. The parsing is shared with the
 * cached external chains, see `chain-cache.ts`.
 *
 * @param propertyChain The chain segments. Segments may use dot or bracket notation themselves.
 * @param sourceObject The object to resolve the chain against.
 * @param operationName The operation resolving the chain, named in the error messages.
 * @throws When an intermediate value is null or undefined (the message names the part of the
 * chain that did not resolve), when the chain contains a forbidden segment, or when it reaches
 * the global object.
 */
export function getPropertyChainValue(
  propertyChain: string[],
  sourceObject: Record<string, any>,
  operationName?: string
) {
  const parsed = parseSegments(propertyChain);
  assertParsedChainSafe(parsed, operationName);
  return walkChain(parsed, sourceObject, operationName);
}
