import {
  assertSafePropertyChain,
  getCurrentOperationName,
} from '@operation/helper/assert-safe-property-chain.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import {getPropertyChainValue} from '@operation/helper/get-property-chain-value.ts';
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

  if (isExternalProperty(propertyChainOrRegularObject)) {
    const propNames = propertyChainOrRegularObject.split('.');
    const prefix = propNames.shift()!.toLowerCase();
    const operationName = getCurrentOperationName(operationScope);
    assertSafePropertyChain(
      propNames,
      propertyChainOrRegularObject,
      operationName
    );
    switch (prefix) {
      case '$operationdata':
        return getPropertyChainValue(propNames, sourceObject, operationName);
      case '$globaldata':
        return deepCopy(
          getPropertyChainValue(propNames, getGlobals(), operationName)
        );
      case '$scope':
        return getScopeChainValue(propNames, operationScope, operationName);
    }
  }

  return propertyChainOrRegularObject;
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
 * meet the same store.
 *
 * If no scope in the chain declares the head property, resolution falls back to
 * the original scope so the standard "cannot be resolved" error is produced.
 */
function getScopeChainValue(
  propertyChain: string[],
  operationScope: IOperationScope,
  operationName?: string
) {
  const scope =
    findDeclaringScope(propertyChain[0], operationScope) ?? operationScope;
  return getPropertyChainValue(propertyChain, scope, operationName);
}

/**
 * Returns the nearest scope, starting at `scope` and walking up through
 * `parent`, that declares the property `head`, or `undefined` when none does.
 *
 * `$scope` chains are read from this scope, and `setVariable` and `setData`
 * write `$scope` targets to it, so the child scopes created by `when` and
 * `forEach` read and update the variables of the enclosing action.
 *
 * @param head The first segment of a `$scope` chain, for example `variables`.
 * @param scope The scope the operation runs in.
 * @returns The declaring scope, or `undefined`.
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
 * Returns the outermost scope of the given scope's parent chain (the scope the
 * action itself runs in).
 *
 * @param scope The scope the operation runs in.
 * @returns The root scope, which is `scope` itself when it has no parent.
 */
export function findRootScope(scope: IOperationScope): IOperationScope {
  let current = scope;
  while (current.parent) {
    current = current.parent;
  }
  return current;
}

export function isExternalProperty(
  value: ExternalProperty | Record<string, any>
): value is ExternalProperty {
  return (
    typeof value === 'string' &&
    (value.toLocaleLowerCase().startsWith('$operationdata.') ||
      value.toLocaleLowerCase().startsWith('$globaldata.') ||
      value.toLocaleLowerCase().startsWith('$scope.'))
  );
}

export type ExternalProperty =
  | `$operationdata.${string}`
  | `$globaldata.${string}`
  | `$scope.${string}`;
