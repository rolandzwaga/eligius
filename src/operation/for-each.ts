import type {breakForEach} from '@operation/break-for-each.ts';
import type {continueForEach} from '@operation/continue-for-each.ts';
import {findMatchingOperationIndex} from '@operation/helper/find-matching-operation-index.ts';
import {
  type ExternalProperty,
  resolveExternalPropertyChain,
} from '@operation/helper/resolve-external-property-chain.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';

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
 * The collection is resolved once, when the loop starts, and the loop iterates over a snapshot
 * of it. Changing, replacing or removing the source collection inside the loop body does not
 * change the items or the number of iterations of the running loop.
 *
 * @category Control Flow
 */
export const forEach: TOperation<IForEachOperationData> = function (
  operationData: IForEachOperationData
) {
  // First iteration of the loop
  if (this.loopIndex === undefined) {
    const resolvedCollection = resolveCollection(
      operationData.collection,
      operationData,
      this
    );
    this.loopEndIndex = findEndForEachIndex(this);
    if (resolvedCollection?.length) {
      this.loopIndex = 0;
      this.loopLength = resolvedCollection.length - 1;
      this.loopStartIndex = this.currentIndex;
      // A shallow copy, so changes to the source array inside the loop body do
      // not change the items of the running loop either.
      loopCollections.set(this, resolvedCollection.slice());
    } else {
      this.newIndex = this.loopEndIndex;

      delete this.loopIndex;
      delete this.loopLength;
      delete this.loopStartIndex;
      delete this.loopEndIndex;
      loopCollections.delete(this);
    }
  }

  const snapshot = loopCollections.get(this);
  if (snapshot && this.loopIndex !== undefined) {
    this.currentItem = snapshot[this.loopIndex];
  }

  return operationData;
};

/**
 * The collection each running loop iterates over, keyed by the loop's scope.
 */
const loopCollections = new WeakMap<IOperationScope, unknown[]>();

/**
 * Forgets the collection snapshot of the loop that runs in the given scope.
 * Called when the loop finishes or breaks.
 *
 * @param scope The loop's scope.
 */
export function clearLoopCollection(scope: IOperationScope): void {
  loopCollections.delete(scope);
}

function resolveCollection(
  collection: IForEachOperationData['collection'],
  operationData: IForEachOperationData,
  scope: IOperationScope
): unknown[] | null | undefined {
  const resolvedCollection =
    typeof collection === 'string'
      ? (resolveExternalPropertyChain(
          operationData,
          scope,
          collection as ExternalProperty
        ) as unknown[] | null | undefined)
      : collection;

  if (
    resolvedCollection !== null &&
    resolvedCollection !== undefined &&
    !Array.isArray(resolvedCollection)
  ) {
    throw new Error(
      'forEach: Expected resolved collection property to be array type, string value was probably not resolved correctly'
    );
  }
  return resolvedCollection;
}

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
