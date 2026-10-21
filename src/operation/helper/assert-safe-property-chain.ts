import type {IOperationScope} from '@operation/types.ts';

/**
 * Property chain segments that lead to an object's prototype or constructor.
 * Reading or writing through them allows prototype pollution or reaching the
 * global `Function` constructor, so property chains may never contain them.
 */
export const forbiddenPropertyChainSegments: ReadonlySet<string> = new Set([
  '__proto__',
  'prototype',
  'constructor',
]);

/**
 * Returns true when the given segment is one of {@link forbiddenPropertyChainSegments}.
 */
export function isForbiddenPropertyChainSegment(segment: string): boolean {
  return forbiddenPropertyChainSegments.has(segment);
}

/**
 * Throws when any of the given segments is `__proto__`, `prototype` or `constructor`.
 *
 * A segment may carry a `+suffix` (as used by `getPropertyChainValue`); only the part
 * before the `+` is checked.
 *
 * @param segments The property chain segments to check.
 * @param propertyChain The chain as written in the configuration, used in the error message.
 * @param operationName The name of the operation resolving the chain, if known.
 * @throws When a forbidden segment is found. The message names the operation, the chain and the segment.
 */
export function assertSafePropertyChain(
  segments: readonly string[],
  propertyChain: string,
  operationName?: string
): void {
  const forbidden = segments.find(segment =>
    isForbiddenPropertyChainSegment(segment.split('+')[0])
  );
  if (forbidden === undefined) {
    return;
  }

  const prefix = operationName
    ? `${operationName}: property chain`
    : 'Property chain';
  throw new Error(
    `${prefix} '${propertyChain}' contains forbidden segment '${forbidden.split('+')[0]}'. Property chains may not contain __proto__, prototype or constructor.`
  );
}

/**
 * Returns the system name of the operation the given scope is currently executing, if known.
 */
export function getCurrentOperationName(
  scope: IOperationScope | undefined
): string | undefined {
  return scope?.operations?.[scope.currentIndex]?.systemName;
}
