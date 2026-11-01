import {
  assertParsedChainSafe,
  findForbiddenSegment,
  type IParsedSegments,
  parseSegments,
  walkChain,
} from '@operation/helper/chain-cache.ts';
import {getGlobals} from '@operation/helper/globals.ts';
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

/**
 * A target key such as `$scope.variables.total`, parsed once. The target text
 * comes from the configuration, so the parsed form is cached.
 */
interface IParsedTarget {
  rootTarget: string;
  /** The chain before the written property */
  path: IParsedSegments;
  /** The first segment of `path` as written, for {@link findDeclaringScope} */
  head: string | undefined;
  pathLength: number;
  /** The property that is written */
  property: string;
  /** The target as printed in the "does not resolve to an object" message */
  targetText: string;
  /** A forbidden segment anywhere in the target, including the written property */
  forbiddenSegment: string | undefined;
}

const MAX_CACHED_TARGETS = 2000;
const parsedTargets = new Map<string, IParsedTarget>();

function parseTarget(item: string): IParsedTarget {
  const cached = parsedTargets.get(item);
  if (cached !== undefined) {
    return cached;
  }
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
  const forbiddenSegment = findForbiddenSegment(path);
  const property = path.pop() ?? '';
  const parsed: IParsedTarget = {
    rootTarget,
    path: parseSegments(path),
    head: path[0],
    pathLength: path.length,
    property,
    targetText: [`$${rootTarget}`, ...path].join('.'),
    forbiddenSegment,
  };
  if (parsedTargets.size >= MAX_CACHED_TARGETS) {
    parsedTargets.clear();
  }
  parsedTargets.set(item, parsed);
  return parsed;
}

function resolveTargets(
  data: Record<TDataTarget, any>,
  operationData: Record<string, any>,
  scope: IOperationScope
) {
  for (const item of Object.keys(data)) {
    const target = parseTarget(item);
    if (target.forbiddenSegment !== undefined) {
      throw new Error(
        `setData: property chain '${item}' contains forbidden segment '${target.forbiddenSegment}'. Property chains may not contain __proto__, prototype or constructor.`
      );
    }
    const propertyValue = resolveExternalPropertyChain(
      operationData,
      scope,
      (data as any)[item]
    );

    let targetObject: TOperationData;
    if (target.rootTarget === 'scope') {
      // An empty path (such as '$scope.newIndex') writes to the current scope.
      targetObject =
        target.pathLength > 0
          ? (findDeclaringScope(target.head as string, scope) ?? scope)
          : scope;
    } else if (target.rootTarget === 'operationdata') {
      targetObject = operationData;
    } else {
      targetObject = getGlobals();
    }

    assertParsedChainSafe(target.path, 'setData');
    const propertyTarget = walkChain(
      target.path,
      targetObject,
      'setData'
    ) as Record<string, any>;

    if (
      propertyTarget === null ||
      (typeof propertyTarget !== 'object' &&
        typeof propertyTarget !== 'function')
    ) {
      throw new Error(
        `setData: cannot write '${item}': '${target.targetText}' does not resolve to an object`
      );
    }

    propertyTarget[target.property] = propertyValue;
  }
}

const knownTargets = ['scope', 'operationdata', 'globaldata'];
function isDataTarget(value: string): value is TDataTarget {
  return knownTargets.includes(value);
}
