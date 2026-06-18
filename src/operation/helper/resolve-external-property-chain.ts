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
    switch (prefix) {
      case '$operationdata':
        return getPropertyChainValue(propNames, sourceObject);
      case '$globaldata':
        return getPropertyChainValue(propNames, getGlobals());
      case '$scope':
        return getScopeChainValue(propNames, operationScope);
    }
  }

  return propertyChainOrRegularObject;
}

/**
 * Resolves a `$scope` property chain, walking up the parent scope chain.
 *
 * `forEach` and `when` execute in a child scope created by `Action._pushScope`,
 * which proxies only a few fields from its parent — notably **not** `variables`.
 * So a variable set with `setVariable` before (or outside) a loop/conditional
 * lives on an ancestor scope, not the child scope the operation runs in.
 *
 * To make those readable, we resolve the chain against the nearest scope (the
 * current one or an ancestor) that actually declares the chain's head property.
 * This gives natural lexical shadowing — an inner declaration of the same name
 * wins over an outer one — and leaves write semantics untouched (`setVariable`
 * still writes to whichever scope it runs in).
 *
 * If no scope in the chain declares the head property, resolution falls back to
 * the original scope so the standard "cannot be resolved" error is produced.
 */
function getScopeChainValue(
  propertyChain: string[],
  operationScope: IOperationScope
) {
  const head = propertyChain[0];
  let scope: IOperationScope | undefined = operationScope;
  while (scope) {
    if (head in scope) {
      return getPropertyChainValue(propertyChain, scope);
    }
    scope = scope.parent;
  }
  return getPropertyChainValue(propertyChain, operationScope);
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
