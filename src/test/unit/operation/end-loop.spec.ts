import { expect } from 'chai';
import { suite } from 'uvu';
import { IOperationContext } from '../../../operation';
import { endLoop } from '../../../operation/end-loop';
import { applyOperation } from '../../../util/apply-operation';

const EndLoopSuite = suite('endLoop');

EndLoopSuite('should return the operation data', () => {
  // given
  const context: IOperationContext = {
    currentIndex: -1,
    eventbus: {} as any,
    operations: [],
  };
  const operationData = {};

  // test
  const result = applyOperation(endLoop, operationData, context);

  // expect
  expect(result).to.be.equal(operationData);
});

EndLoopSuite(
  'should increment loopIndex and restart the newIndex when the current is lower than the loopLength',
  () => {
    // given
    const context: IOperationContext = {
      currentIndex: -1,
      loopIndex: 1,
      loopLength: 10,
      loopStartIndex: 5,
      newIndex: 10,
      eventbus: {} as any,
      operations: [],
    };
    const operationData = {};

    // test
    applyOperation(endLoop, operationData, context);

    // expect
    expect(context.loopIndex).to.be.equal(2);
    expect(context.loopLength).to.be.equal(10);
    expect(context.loopStartIndex).to.be.equal(5);
    expect(context.newIndex).to.be.equal(5);
  }
);

EndLoopSuite.run();
