import {assertSafePropertyChain} from '@operation/helper/assert-safe-property-chain.ts';
import {getPropertyChainValue} from '@operation/helper/get-property-chain-value.ts';
import {getGlobals, type TGlobalCache} from '@operation/helper/globals.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import {
  findDeclaringScope,
  resolveExternalPropertyChain,
} from '@operation/helper/resolve-external-property-chain.ts';
import type {
  IOperationScope,
  TOperation,
  TOperationData,
} from '@operation/types.ts';

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
 * A `$scope` target with a property chain, such as `$scope.variables.total`, is written to the
 * nearest scope that declares the chain's first property, the same scope a `$scope` read
 * resolves from. Inside a `when` or `forEach` block this updates the action's variables.
 *
 * @throws When a target is not `$scope`, `$operationdata` or `$globaldata`, when it contains a
 * forbidden segment, or when the part before the written property does not resolve to an object.
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
    // Guard every segment, including the property that is written, against
    // prototype pollution before anything is resolved or assigned.
    assertSafePropertyChain(path, item, 'setData');
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
      // An empty path (such as '$scope.newIndex') writes to the current scope.
      scope:
        path.length > 0 ? (findDeclaringScope(path[0], scope) ?? scope) : scope,
      operationdata: operationData,
      globaldata: getGlobals(),
    };

    const propertyTarget = getPropertyChainValue(
      path,
      (targets as any)[rootTarget],
      'setData'
    ) as Record<string, any>;

    if (
      propertyTarget === null ||
      (typeof propertyTarget !== 'object' &&
        typeof propertyTarget !== 'function')
    ) {
      throw new Error(
        `setData: cannot write '${item}': '${[`$${rootTarget}`, ...path].join('.')}' does not resolve to an object`
      );
    }

    propertyTarget[property] = propertyValue;
  });
}

const knownTargets = ['scope', 'operationdata', 'globaldata'];
function isDataTarget(value: string): value is TDataTarget {
  return knownTargets.includes(value);
}
