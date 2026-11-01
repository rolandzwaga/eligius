// Attributes the interpreter's cost to its pieces: operation dispatch,
// configured-data copying, loop bookkeeping and the two data operations the
// Phase 0 action spends its time in. Numbers are recorded in
// specs/007-aot-compiler/measurements.md. Imports dist/ like
// action-overhead.bench.ts, for the same reason.
import {
  Action,
  Eventbus,
  endForEach,
  forEach,
  type IOperationScope,
  type IResolvedOperation,
  setData,
  setOperationData,
  type TOperation,
  type TOperationData,
} from 'eligius';
import {describe, test} from 'vitest';

const ops = {forEach, endForEach, setData, setOperationData};
const ActionClass = Action;
const record: TOperation<any, any> = d => d;
const items = Array.from({length: 20}, (_, i) => `item-${i}`);

function resolved(
  specs: Array<[string, TOperation<any, any>, TOperationData]>
): IResolvedOperation[] {
  return specs.map(([systemName, instance, operationData], i) => ({
    id: `op-${i}`,
    systemName,
    operationData,
    instance,
  }));
}

function bag(): TOperationData {
  return {
    selectedElement: {jquery: '4'},
    count: 3,
    items: items.slice(),
    collection: '$operationdata.items',
    label: 'item-0',
    last: 'item-0',
  };
}

describe('micro: where the per-iteration cost goes', () => {
  test('pieces', {timeout: 120_000}, async ({bench}) => {
    const eventbus = new Eventbus();
    const scope: IOperationScope = {
      currentIndex: 1,
      eventbus,
      operations: resolved([
        ['forEach', ops.forEach, {}],
        ['setOperationData', ops.setOperationData, {}],
        ['setData', ops.setData, {}],
      ]),
      currentItem: 'item-3',
      loopIndex: 3,
    };

    const twentyPrimitiveOps = new ActionClass(
      'p',
      resolved(Array.from({length: 20}, () => ['record', record, {a: 1}])),
      eventbus
    );
    const twentyNestedOps = new ActionClass(
      'n',
      resolved(
        Array.from({length: 20}, () => ['record', record, {nested: {a: 1}}])
      ),
      eventbus
    );
    const loopOfRecords = new ActionClass(
      'l',
      resolved([
        ['forEach', ops.forEach, {collection: items}],
        ['record', record, {}],
        ['record', record, {}],
        ['endForEach', ops.endForEach, {}],
      ]),
      eventbus
    );

    await bench.compare(
      bench('20 ops, primitive config (dispatch only)', () =>
        twentyPrimitiveOps.start()
      ),
      bench('20 ops, nested config (dispatch + deepCopy)', () =>
        twentyNestedOps.start()
      ),
      bench('forEach over 20 with 2 no-op ops (loop bookkeeping)', () =>
        loopOfRecords.start()
      ),
      bench('setOperationData alone (label: $scope.currentItem)', () => {
        ops.setOperationData.call(scope, {
          ...bag(),
          properties: {label: '$scope.currentItem'},
        });
      }),
      bench('setData alone ($operationdata.last: $operationdata.label)', () => {
        ops.setData.call(scope, {
          ...bag(),
          properties: {'$operationdata.last': '$operationdata.label'},
        });
      }),
      bench('bag() spread only (baseline for the two above)', () => {
        bag();
      }),
      {time: 800, warmupTime: 200}
    );
  });
});
