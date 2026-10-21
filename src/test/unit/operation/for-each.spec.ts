import {Action} from '@action/action.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import {endForEach} from '@operation/end-for-each.ts';
import {
  endForEachSystemName,
  forEach,
  forEachSystemName,
} from '@operation/for-each.ts';
import {removeGlobal} from '@operation/helper/remove-global.ts';
import {setGlobal} from '@operation/helper/set-global.ts';
import {removePropertiesFromOperationData} from '@operation/remove-properties-from-operation-data.ts';
import type {IOperationScope} from '@operation/types.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test, vi} from 'vitest';

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

describe('forEach collection snapshot', () => {
  const op = (systemName: string, instance: any, operationData = {}) => ({
    id: systemName,
    systemName,
    operationData,
    instance,
  });

  function recorder(items: unknown[]) {
    return op('record', function (this: IOperationScope, data: any) {
      items.push(this.currentItem);
      return data;
    });
  }

  test('given forEach over $operationdata.items = [1,2,3] and a loop body that removes items from operation data, when the action runs, then currentItem is 1, 2, 3 on the three iterations', async () => {
    // given
    const items: unknown[] = [];
    const action = new Action(
      'test',
      [
        op(forEachSystemName, forEach, {collection: '$operationdata.items'}),
        recorder(items),
        op('removeProperties', removePropertiesFromOperationData, {
          propertyNames: ['items'],
        }),
        op(endForEachSystemName, endForEach),
      ],
      new Eventbus()
    );

    // test
    await action.start({items: [1, 2, 3]});

    // expect
    expect(items).toEqual([1, 2, 3]);
  });

  test('given forEach over a $globaldata list and a loop body that replaces it with a shorter list, when the action runs, then the loop visits the original items', async () => {
    // given
    setGlobal('list', ['a', 'b', 'c']);
    const items: unknown[] = [];
    const action = new Action(
      'test',
      [
        op(forEachSystemName, forEach, {collection: '$globaldata.list'}),
        recorder(items),
        op('shrink', (data: any) => {
          setGlobal('list', ['x']);
          return data;
        }),
        op(endForEachSystemName, endForEach),
      ],
      new Eventbus()
    );

    // test
    try {
      await action.start();
    } finally {
      removeGlobal('list');
    }

    // expect
    expect(items).toEqual(['a', 'b', 'c']);
  });

  test('given forEach over a property chain, when the loop runs three iterations, then the chain is resolved once', async () => {
    // given
    const source = {items: [1, 2, 3]};
    const reads = vi.fn(() => source.items);
    const data = Object.defineProperty({}, 'items', {
      get: reads,
      enumerable: true,
    });
    const action = new Action(
      'test',
      [
        op(forEachSystemName, forEach, {collection: '$operationdata.items'}),
        op(endForEachSystemName, endForEach),
      ],
      new Eventbus()
    );

    // test
    await action.start(data);

    // expect
    expect(reads).toHaveBeenCalledTimes(1);
  });
});
