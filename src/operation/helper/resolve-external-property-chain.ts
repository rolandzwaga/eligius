import { IOperationContext, TOperationData } from '../types';
import { getPropertyChainValue } from './get-property-chain-value';
import { getGlobals } from './globals';

/**
 * Resolves operation and global data property chains.
 *
 * An operation data property chain is designated by a `operationdata.` suffix, followed by an arbitrary property chain.
 * For global data the suffix should be `globaldata.`
 *
 * If the propertyChainOrRegularObject is not a property chain, this value is returned instead.
 *
 * @param sourceObject The object that represents the operation data
 * @param propertyChainOrRegularObject A period delimited string, or just a regular object
 * @returns
 */
export function resolveExternalPropertyChain(
  sourceObject: TOperationData,
  operationContext: IOperationContext,
  propertyChainOrRegularObject: ExternalProperty|Record<string,any>
) {
  if (isExternalProperty(propertyChainOrRegularObject)) {
    const propNames = propertyChainOrRegularObject.split('.');
    const prefix = propNames.shift()?.toLowerCase();
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

function isExternalProperty(value: ExternalProperty|Record<string,any>): value is ExternalProperty {
  return typeof value === "string";
}

export type ExternalProperty = `operationdata.${string}` | `globaldata.${string}` | `context.${string}`;