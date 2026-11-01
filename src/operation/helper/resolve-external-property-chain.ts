import {getCurrentOperationName} from '@operation/helper/assert-safe-property-chain.ts';
import {
  assertParsedChainSafe,
  externalPrefixOf,
  getParsedChain,
  walkChain,
} from '@operation/helper/chain-cache.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import {getGlobals} from '@operation/helper/globals.ts';
import type {IOperationScope, TOperationData} from '@operation/types.ts';

/**
 * Resolves operation and global data property chains.
 *
 * An operation data property chain is designated by a `operationdata.` suffix, followed by an arbitrary property chain.
 * For global data the suffix should be `globaldata.`
 *
 * If the propertyChainOrRegularObject is not a property chain, this value is returned instead.
 *
 * A `$globaldata` chain returns a deep copy of the global value (jQuery objects, DOM nodes,
 * functions and class instances stay references), the same as `getGlobals(name)`, so changing
 * the returned value in place never changes the shared global store. Write to the store with
 * `setGlobalData` or `setData` instead.
 *
 * The chain text is parsed once and cached (see `chain-cache.ts`); the value is read on every
 * call.
 */
export function resolveExternalPropertyChain(
  sourceObject: TOperationData,
  operationScope: IOperationScope,
  propertyChainOrRegularObject:
    | ExternalProperty
    | Record<string, any>
    | null
    | undefined
) {
  if (
    propertyChainOrRegularObject === null ||
    propertyChainOrRegularObject === undefined
  ) {
    return null;
  }

  if (typeof propertyChainOrRegularObject !== 'string') {
    return propertyChainOrRegularObject;
  }

  const parsed = getParsedChain(propertyChainOrRegularObject);
  if (parsed === null) {
    return propertyChainOrRegularObject;
  }

  const operationName = getCurrentOperationName(operationScope);
  assertParsedChainSafe(parsed, operationName);
  switch (parsed.prefix) {
    case 'operationdata':
      return walkChain(parsed, sourceObject, operationName);
    case 'globaldata':
      return deepCopy(walkChain(parsed, getGlobals(), operationName));
    case 'scope':
      return walkChain(
        parsed,
        findDeclaringScope(parsed.head, operationScope) ?? operationScope,
        operationName
      );
  }
}

/**
 * Resolves a `$scope` property chain, walking up the parent scope chain.
 *
 * `forEach` and `when` execute in a child scope created by `Action._pushScope`,
 * which proxies only a few fields from its parent. A variable set with
 * `setVariable` lives on the scope that declares `variables` (the action's root
 * scope), not on the child scope an operation inside a loop or conditional runs
 * in.
 *
 * The chain is resolved against the nearest scope (the current one or an
 * ancestor) that declares the chain's head property, see
 * {@link findDeclaringScope}. `setVariable` and `setData` pick their write
 * target with the same rule, so reads and writes of `$scope.variables.*` always
 * meet on the same scope object.
 *
 * @param head The first segment of the chain as written, for example `variables`
 * @param scope The scope the operation runs in
 * @returns The nearest scope that has `head` as an own or inherited property, or undefined
 */
export function findDeclaringScope(
  head: string,
  scope: IOperationScope
): IOperationScope | undefined {
  let current: IOperationScope | undefined = scope;
  while (current) {
    if (head in current) {
      return current;
    }
    current = current.parent;
  }
  return undefined;
}

/**
 * Returns the outermost scope of the given scope's parent chain: the
 * action's root scope.
 */
export function findRootScope(scope: IOperationScope): IOperationScope {
  let current = scope;
  while (current.parent) {
    current = current.parent;
  }
  return current;
}

/**
 * Returns true when the value is a `$operationdata.`, `$globaldata.` or
 * `$scope.` property chain. The prefix is matched without regard to case.
 */
export function isExternalProperty(
  value: ExternalProperty | Record<string, any>
): value is ExternalProperty {
  return typeof value === 'string' && externalPrefixOf(value) !== undefined;
}

export type ExternalProperty =
  | `$operationdata.${string}`
  | `$globaldata.${string}`
  | `$scope.${string}`;
