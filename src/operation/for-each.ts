import type {breakForEach} from './break-for-each.ts';
import type {continueForEach} from './continue-for-each.ts';
import {findMatchingOperationIndex} from './helper/find-matching-operation-index.ts';
import {
  type ExternalProperty,
  resolveExternalPropertyChain,
} from './helper/resolve-external-property-chain.ts';
import type {IOperationScope, TOperation} from './types.ts';

export interface IForEachOperationData {
  /**
   * @type=ParameterType:array|ParameterType:string
   * @required
   */
  collection: unknown[] | string;
}

/**
 * This operation iterates over the given collection.
 *
 * Each iteration the current item from the specified collection is
 * assigned to the {@link IOperationScope.currentItem|currentItem} property on the {@link IOperationScope|operation scope}.
 *
 * At the start of the loop, the associated {@link endForEach} operation is determined and when
 * the last iteration is completed the flow control is set to the index of that operation.
 *
 * The {@link continueForEach|continue} and {@link breakForEach|break} operations can be used to control the
 * loop iterations.
 *
 * @category Control Flow
 */
export const forEach: TOperation<IForEachOperationData> = function (
  operationData: IForEachOperationData
) {
  const {collection} = operationData;
  const resolvedCollection =
    typeof collection === 'string'
      ? (resolveExternalPropertyChain(
          operationData,
          this,
          collection as ExternalProperty
        ) as any[])
      : collection;

  if (
    resolvedCollection !== null &&
    resolvedCollection !== undefined &&
    !Array.isArray(resolvedCollection)
  ) {
    throw new Error(
      'Expected resolved collection property to be array type, string value was probably not resolved correctly'
    );
  }

  // First iteration of the loop
  if (this.loopIndex === undefined) {
    this.loopEndIndex = findEndForEachIndex(this);
    if (resolvedCollection?.length) {
      this.loopIndex = 0;
      this.loopLength = resolvedCollection.length - 1;
      this.loopStartIndex = this.currentIndex;
    } else {
      this.newIndex = this.loopEndIndex;

      delete this.loopIndex;
      delete this.loopLength;
      delete this.loopStartIndex;
      delete this.loopEndIndex;
    }
  }

  if (resolvedCollection?.length && this.loopIndex !== undefined) {
    this.currentItem = resolvedCollection[this.loopIndex];
  }

  return operationData;
};

function findEndForEachIndex(scope: IOperationScope) {
  const currentIndex = scope.currentIndex + 1;
  const list = scope.operations.slice(currentIndex);

  const index = list.findIndex(
    findMatchingOperationIndex.bind({
      counter: 0,
      self: forEachSystemName,
      matchingName: endForEachSystemName,
    })
  );
  const endLoopIndex =
    index > -1 ? index + currentIndex : scope.operations.length;

  return endLoopIndex;
}

export const forEachSystemName = 'forEach';
export const endForEachSystemName = 'endForEach';
