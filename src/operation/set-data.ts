import { getPropertyChainValue } from './helper/get-property-chain-value';
import { getGlobals, TGlobalCache } from './helper/globals';
import { resolveExternalPropertyChain } from './helper/resolve-external-property-chain';
import { IOperationContext, TOperation, TOperationData } from './types';

export type TDataTarget =
  | `context.${string}`
  | `operationdata.${string}`
  | `globaldata.${string}`;

export interface ISetDataOperationData {
  properties: Record<TDataTarget, any>;
}

/**
 * This operation assigns the specified properties to the specified data targets.
 *
 * @example The various ways of assigning data
 * ```ts
 * setData({
 *  'operationdata.foo': 'context.currentItem', // context.currentItem will be assigned to operationdata.foo
 *  'globaldata.foo': 'context.currentItem',    // context.currentItem will be assigned to globaldata.foo
 *  'context.newIndex': 100,                    // The constant 100 will be assigned to context.newIndex
 * })
 * ```
 *
 * @param operationData
 * @returns
 */
export const setData: TOperation<ISetDataOperationData> = function (
  operationData: ISetDataOperationData
) {
  const { properties } = operationData;
  delete (operationData as any).properties;

  resolveTargets(properties, operationData, this);

  return operationData;
};

function resolveTargets(
  data: Record<TDataTarget, any>,
  operationData: Record<string, any>,
  context: IOperationContext
) {
  const propertyChains = Object.keys(data);

  return propertyChains.forEach((item) => {
    const path = item.split('.');
    const rootTarget = path.shift()?.toLowerCase() ?? '';
    if (!isDataTarget(rootTarget)) {
      throw new Error(
        `Unrecognized target: ${rootTarget}, known targets are: ${knownTargets.join(
          ', '
        )}`
      );
    }
    const property = path.pop() ?? '';
    const propertyValue = resolveExternalPropertyChain(
      operationData,
      context,
      (data as any)[item]
    );

    const targets: {
      context: IOperationContext;
      operationdata: TOperationData;
      globaldata: TGlobalCache;
    } = {
      context: context,
      operationdata: operationData,
      globaldata: getGlobals(),
    };

    const propertyTarget = getPropertyChainValue(
      path,
      (targets as any)[rootTarget]
    );

    propertyTarget[property] = propertyValue;
  });
}

const knownTargets = ['context', 'operationdata', 'globaldata'];
function isDataTarget(value: string): value is TDataTarget {
  return knownTargets.includes(value);
}
