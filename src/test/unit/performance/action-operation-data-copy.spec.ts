import {Action} from '@action/action.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Eventbus} from '@eventbus/index.ts';
import {endForEach} from '@operation/end-for-each.ts';
import {forEach} from '@operation/for-each.ts';
import type {TOperationData} from '@operation/types.ts';
import {beforeEach, describe, expect, test, vi} from 'vitest';

/**
 * Allocation-independent checks for the operation data copy that `Action`
 * makes before each operation runs. Instead of timing the run, every value
 * passed to `deepCopy` is recorded, so the amount of copying is counted
 * exactly.
 */
const copies = vi.hoisted(() => ({values: [] as unknown[]}));

vi.mock('@operation/helper/deep-copy.ts', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@operation/helper/deep-copy.ts')>();
  return {
    deepCopy: <T>(value: T): T => {
      copies.values.push(value);
      return actual.deepCopy(value);
    },
  };
});

function copiedCollectionElements() {
  return copies.values.reduce<number>((total, value) => {
    const collection = (value as {collection?: unknown} | undefined)
      ?.collection;
    return total + (Array.isArray(collection) ? collection.length : 0);
  }, 0);
}

function createLoop(
  collection: unknown[] | string,
  body: IResolvedOperation[]
): IResolvedOperation[] {
  return [
    {
      id: 'loop',
      systemName: 'forEach',
      operationData: {collection},
      instance: forEach as any,
    },
    ...body,
    {
      id: 'end-loop',
      systemName: 'endForEach',
      operationData: {},
      instance: endForEach as any,
    },
  ];
}

function passThrough(
  id: string,
  operationData: TOperationData
): IResolvedOperation {
  return {id, systemName: id, operationData, instance: data => data};
}

describe('Action operation data copying', () => {
  beforeEach(() => {
    copies.values.length = 0;
  });

  test('given a forEach over a literal collection of 1000 items, when the action starts, then the collection is copied once instead of once per iteration', async () => {
    // given
    const size = 1000;
    const items = Array.from({length: size}, (_, i) => ({id: i}));
    let iterations = 0;
    const action = new Action(
      'loop',
      createLoop(items, [
        {
          id: 'count',
          systemName: 'count',
          operationData: {},
          instance: data => {
            iterations++;
            return data;
          },
        },
      ]),
      new Eventbus()
    );

    // test
    await action.start();

    // expect
    expect(iterations).toBe(size);
    // Copying grows linearly with the collection, not with size * iterations.
    expect(copiedCollectionElements()).toBe(size);
  });

  test('given a forEach over a literal collection, when the action starts twice, then each run copies the collection once', async () => {
    // given
    const action = new Action(
      'loop',
      createLoop([1, 2, 3, 4], []),
      new Eventbus()
    );

    // test
    await action.start();
    await action.start();

    // expect
    expect(copiedCollectionElements()).toBe(8);
  });

  test('given a nested forEach over literal collections, when the action starts, then the inner collection is copied once per outer iteration', async () => {
    // given
    const inner = createLoop(['a', 'b', 'c'], []).map((operation, index) => ({
      ...operation,
      id: `inner-${index}`,
    }));
    const action = new Action(
      'nested',
      createLoop([1, 2], inner),
      new Eventbus()
    );

    // test
    await action.start();

    // expect
    // Outer collection once (2 elements) plus the inner collection once per
    // outer iteration (2 * 3 elements).
    expect(copiedCollectionElements()).toBe(2 + 2 * 3);
  });

  test('given operations whose configured data is empty or holds only primitives and functions, when the action starts repeatedly, then nothing is deep copied', async () => {
    // given
    const action = new Action(
      'flat',
      [
        passThrough('empty', {}),
        passThrough('primitives', {
          selector: '#id',
          count: 3,
          enabled: true,
          missing: null,
          absent: undefined,
          mapFunction: (x: number) => x,
        }),
        ...createLoop('$operationData.items', [passThrough('body', {})]),
      ],
      new Eventbus()
    );

    // test
    for (let run = 0; run < 5; run++) {
      await action.start({items: [1, 2, 3]});
    }

    // expect
    expect(copies.values).toEqual([]);
  });

  test('given an operation with nested configured data inside a forEach, when the action starts, then that data is copied once per execution', async () => {
    // given
    const action = new Action(
      'nested-data',
      createLoop('$operationData.items', [
        passThrough('body', {options: {duration: 1}}),
      ]),
      new Eventbus()
    );

    // test
    await action.start({items: [1, 2, 3]});

    // expect
    expect(copies.values).toEqual([
      {options: {duration: 1}},
      {options: {duration: 1}},
      {options: {duration: 1}},
    ]);
  });
});
