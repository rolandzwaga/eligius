import {expect, describe, test} from 'vitest';
import {forEach} from '../../../operation/for-each.ts';
import type {IOperationScope} from '../../../operation/types.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('forEach', () => {
  test('should set the scope when a valid collection is passed in', () => {
    // given
    const scope: IOperationScope = {
      currentIndex: 10,
      eventbus: {} as any,
      operations: [],
    };
    const operationData = {
      collection: [1, 2, 3, 4],
    };

    // test
    applyOperation(forEach, operationData, scope);

    // expect
    expect(scope.loopIndex).toBe(0);
    expect(scope.loopLength).toBe(3);
    expect(scope.loopStartIndex).toBe(10);
    expect(scope.currentItem).toBe(1);
  });
  test('should set the scope when an empty collection is passed in', () => {
    // given
    const scope: IOperationScope = {
      currentIndex: 10,
      eventbus: {} as any,
      operations: [],
    };
    const operationData = {
      collection: [],
    };

    // test
    applyOperation(forEach, operationData, scope);

    // expect
    expect(scope.loopIndex).toBeUndefined();
    expect(scope.loopLength).toBeUndefined();
    expect(scope.loopStartIndex).toBeUndefined();
    expect(scope.currentItem).toBeUndefined();
  });
  test('should set the scope when a null collection is passed in', () => {
    // given
    const scope: IOperationScope = {
      currentIndex: 10,
      eventbus: {} as any,
      operations: [],
    };
    const operationData = {
      collection: null,
    };

    // test
    applyOperation(forEach, operationData, scope);

    // expect
    expect(scope.loopIndex).toBeUndefined();
    expect(scope.loopLength).toBeUndefined();
    expect(scope.loopStartIndex).toBeUndefined();
    expect(scope.currentItem).toBeUndefined();
  });

  test('should set the scope when an undefined collection is passed in', () => {
    // given
    const scope: IOperationScope = {
      currentIndex: 10,
      eventbus: {} as any,
      operations: [],
    };
    const operationData = {
      collection: undefined,
    };

    // test
    applyOperation(forEach, operationData, scope);

    // expect
    expect(scope.loopIndex).toBeUndefined();
    expect(scope.loopLength).toBeUndefined();
    expect(scope.loopStartIndex).toBeUndefined();
    expect(scope.currentItem).toBeUndefined();
  });

  test('should throw error when resolved collection is not an array', () => {
    // given
    const scope: IOperationScope = {
      currentIndex: 10,
      eventbus: {} as any,
      operations: [],
    };
    const operationData = {
      collection: {notAnArray: true} as any,
    };

    // test & expect
    expect(() => applyOperation(forEach, operationData, scope)).toThrow(
      'Expected resolved collection property to be array type'
    );
  });

  test('should handle single-item collection correctly', () => {
    // given
    const scope: IOperationScope = {
      currentIndex: 5,
      eventbus: {} as any,
      operations: [],
    };
    const operationData = {
      collection: ['onlyItem'],
    };

    // test
    applyOperation(forEach, operationData, scope);

    // expect
    expect(scope.loopIndex).toBe(0);
    expect(scope.loopLength).toBe(0);
    expect(scope.loopStartIndex).toBe(5);
    expect(scope.currentItem).toBe('onlyItem');
  });
});
