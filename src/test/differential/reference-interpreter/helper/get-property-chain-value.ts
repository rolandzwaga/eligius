// PINNED COPY of src/operation/helper/get-property-chain-value.ts at commit d937f6be. Do not edit.
// Reference interpreter for the differential harness of specs/007-aot-compiler
// (Phase 1: old interpreter vs optimised interpreter). Delete after Phase 4.
import {assertSafePropertyChain} from './assert-safe-property-chain.ts';

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

  const prefix = operationName
    ? `${operationName}: property chain`
    : 'Property chain';

  const result = chain.reduce((currentInstance, prop, index) => {
    // Only null and undefined cannot be indexed; '', 0 and false are valid
    // intermediates ('' .length, (0).toFixed).
    if (currentInstance === null || currentInstance === undefined) {
      const resolvedPart = chain.slice(0, index).join('.');
      throw new Error(
        `${prefix} '${chain.join('.')}' cannot be resolved: '${resolvedPart}' is ${currentInstance}.`
      );
    }
    if (index > 0 && isGlobalObject(currentInstance)) {
      throw globalObjectError(prefix, chain, index);
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

  if (chain.length > 0 && isGlobalObject(result)) {
    throw globalObjectError(prefix, chain, chain.length);
  }

  return suffix ? `${result}${suffix}` : result;
}

function globalObjectError(prefix: string, chain: string[], index: number) {
  return new Error(
    `${prefix} '${chain.join('.')}' reaches the global object at '${chain
      .slice(0, index)
      .join('.')}'. Property chains may not access the global object.`
  );
}

/**
 * Returns true for the global object (`window`), including the window of another frame.
 */
export function isGlobalObject(value: unknown): boolean {
  return (
    value === globalThis ||
    (typeof value === 'object' &&
      value !== null &&
      Object.prototype.toString.call(value) === '[object Window]')
  );
}
