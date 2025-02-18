import { expect } from 'chai';
import { suite } from 'uvu';
import { forEach } from '../../../operation/for-each.ts';
import type { IOperationContext } from '../../../operation/types.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

const ForEachSuite = suite('forEach');

ForEachSuite('should set the context when a valid collection is passed in', () => {
  // given
  const context: IOperationContext = {
    currentIndex: 10,
    eventbus: {} as any,
    operations: [],
  };
  const operationData = {
    collection: [1, 2, 3, 4],
  };

  // test
  applyOperation<{ currentItem: number }>(forEach, operationData, context);

  // expect
  expect(context.loopIndex).to.equal(0);
  expect(context.loopLength).to.equal(3);
  expect(context.loopStartIndex).to.equal(10);
  expect(context.currentItem).to.equal(1);
});

ForEachSuite('should set the context when an empty collection is passed in', () => {
  // given
  const context: IOperationContext = {
    currentIndex: 10,
    eventbus: {} as any,
    operations: [],
  };
  const operationData = {
    collection: [],
  };

  // test
  applyOperation<{ currentItem: number }>(forEach, operationData, context);

  // expect
  expect(context.loopIndex).to.be.undefined;
  expect(context.loopLength).to.be.undefined;
  expect(context.loopStartIndex).to.be.undefined;
  expect(context.currentItem).to.be.undefined;
});

ForEachSuite('should set the context when a null collection is passed in', () => {
  // given
  const context: IOperationContext = {
    currentIndex: 10,
    eventbus: {} as any,
    operations: [],
  };
  const operationData = {
    collection: null,
  };

  // test
  applyOperation<{ currentItem: number }>(forEach, operationData, context);

  // expect
  expect(context.loopIndex).to.be.undefined;
  expect(context.loopLength).to.be.undefined;
  expect(context.loopStartIndex).to.be.undefined;
  expect(context.currentItem).to.be.undefined;
});

ForEachSuite.run();
