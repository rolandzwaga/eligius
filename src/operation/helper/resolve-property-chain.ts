import { getPropertyChainValue } from './get-property-chain-value.ts';

/**
 * Gets the value for the given property chain. A property chain is defined by a period delimited string.
 *
 * For example, this property chain: `mySource.subSource.element.value` should be extracted from an object of this shape:
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
 * The result of the invocation `resolvePropertyChain('mySource.subSource.element.value', foo)` would then yield the value `bar`.
 */
export function resolvePropertyChain(propertyChain: string, sourceObject: any) {
  const properties = propertyChain.split('.');
  return getPropertyChainValue(properties, sourceObject);
}
