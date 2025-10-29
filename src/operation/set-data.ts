import {getPropertyChainValue} from './helper/get-property-chain-value.ts';
import {getGlobals, type TGlobalCache} from './helper/globals.ts';
import {removeProperties} from './helper/remove-operation-properties.ts';
import {resolveExternalPropertyChain} from './helper/resolve-external-property-chain.ts';
import type {IOperationScope, TOperation, TOperationData} from './types.ts';

export type TDataTarget =
  | `$scope.${string}`
  | `$operationdata.${string}`
  | `$globaldata.${string}`;

export interface ISetDataOperationData {
  /**
   * @required
   * @erased
   */
  properties: Record<TDataTarget, any>;
}

/**
 * This operation assigns the specified properties to the specified data targets.
 *
 * @example The various ways of assigning data
 * ```ts
 * setData({
 *  '$operationdata.foo': '$scope.currentItem', // $scope.currentItem will be assigned to $operationdata.foo
 *  '$globaldata.foo': '$scope.currentItem',    // $scope.currentItem will be assigned to $globaldata.foo
 *  '$scope.newIndex': 100,                    // The constant 100 will be assigned to $scope.newIndex
 * })
 * ```
 *
 * @category Data
 */
export const setData: TOperation<
  ISetDataOperationData,
  Omit<ISetDataOperationData, 'properties'>
> = function (operationData: ISetDataOperationData) {
  const {properties} = operationData;
  removeProperties(operationData, 'properties');

  resolveTargets(properties, operationData, this);

  return operationData;
};

function resolveTargets(
  data: Record<TDataTarget, any>,
  operationData: Record<string, any>,
  scope: IOperationScope
) {
  const propertyChains = Object.keys(data);

  return propertyChains.forEach(item => {
    const path = item.split('.');
    const rootTarget = path.shift()?.toLowerCase().substring(1) ?? '';
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
      scope,
      (data as any)[item]
    );

    const targets: {
      scope: IOperationScope;
      operationdata: TOperationData;
      globaldata: TGlobalCache;
    } = {
      scope,
      operationdata: operationData,
      globaldata: getGlobals(),
    };

    const propertyTarget = getPropertyChainValue(
      path,
      (targets as any)[rootTarget]
    ) as Record<string, any>;

    propertyTarget[property] = propertyValue;
  });
}

const knownTargets = ['scope', 'operationdata', 'globaldata'];
function isDataTarget(value: string): value is TDataTarget {
  return knownTargets.includes(value);
}
