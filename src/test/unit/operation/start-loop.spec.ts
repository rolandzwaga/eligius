import { expect } from 'chai';
import { suite } from 'uvu';
import { startLoop } from '../../../operation/start-loop';
import { IOperationContext } from '../../../operation/types';
import { applyOperation } from '../../../util/apply-operation';

const StartLoopSuite = suite('startLoop');

StartLoopSuite(
  'should set the context when a valid collection is passed in',
  () => {
    // given
    const context: IOperationContext = {
      currentIndex: 10,
      eventbus: {} as any,
    };
    const operationData = {
      collection: [1, 2, 3, 4],
    };

    // test
    const result = applyOperation<{ currentItem: number }>(
      startLoop,
      operationData,
      context
    );

    // expect
    expect(context.loopIndex).to.equal(0);
    expect(context.loopLength).to.equal(3);
    expect(context.startIndex).to.equal(10);
    expect(result.currentItem).to.equal(1);
  }
);

StartLoopSuite(
  'should set the context when an empty collection is passed in',
  () => {
    // given
    const context: IOperationContext = {
      currentIndex: 10,
      eventbus: {} as any,
    };
    const operationData = {
      collection: [],
    };

    // test
    const result = applyOperation<{ currentItem: number }>(
      startLoop,
      operationData,
      context
    );

    // expect
    expect(context.loopIndex).to.be.undefined;
    expect(context.loopLength).to.be.undefined;
    expect(context.startIndex).to.be.undefined;
    expect(context.skipNextOperation).to.be.true;
    expect(result.currentItem).to.be.undefined;
  }
);

StartLoopSuite(
  'should set the context when a null collection is passed in',
  () => {
    // given
    const context: IOperationContext = {
      currentIndex: 10,
      eventbus: {} as any,
    };
    const operationData = {
      collection: null,
    };

    // test
    const result = applyOperation<{ currentItem: number }>(
      startLoop,
      operationData,
      context
    );

    // expect
    expect(context.loopIndex).to.be.undefined;
    expect(context.loopLength).to.be.undefined;
    expect(context.startIndex).to.be.undefined;
    expect(context.skipNextOperation).to.be.true;
    expect(result.currentItem).to.be.undefined;
  }
);

StartLoopSuite.run();
