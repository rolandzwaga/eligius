import { isString } from '../../util/guards/is-string';
import { IOperationContext } from '../types';
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
  sourceObject: any,
  operationContext: IOperationContext,
  propertyChainOrRegularObject: any
) {
  if (isString(propertyChainOrRegularObject)) {
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
