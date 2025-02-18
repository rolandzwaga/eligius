import type { IOperationContext, TOperationData } from '../types.ts';
import { getPropertyChainValue } from './get-property-chain-value.ts';
import { getGlobals } from './globals.ts';

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
  operationContext: IOperationContext,
  propertyChainOrRegularObject: ExternalProperty|Record<string,any>|null|undefined
) {
  if (propertyChainOrRegularObject === null || propertyChainOrRegularObject === undefined) {
    return null;
  }

  if (isExternalProperty(propertyChainOrRegularObject)) {
    const propNames = propertyChainOrRegularObject.split('.');
    const prefix = propNames.shift()!.toLowerCase();
    switch (prefix) {
      case 'operationdata':
        return getPropertyChainValue(propNames, sourceObject);
      case 'globaldata':
        return getPropertyChainValue(propNames, getGlobals());
      case 'context':
        return getPropertyChainValue(propNames, operationContext);
    }
  }

  return propertyChainOrRegularObject;
}

export function isExternalProperty(value: ExternalProperty|Record<string,any>): value is ExternalProperty {
  return (typeof value === "string" && (value.toLocaleLowerCase().startsWith('operationdata.') || (value.toLocaleLowerCase().startsWith('globaldata.')) || (value.toLocaleLowerCase().startsWith('context.'))));
}

export type ExternalProperty = `operationdata.${string}` | `globaldata.${string}` | `context.${string}`;