import { expect } from 'chai';
import { suite } from 'uvu';
import { IOperationContext } from '../../../operation';
import { endForEach } from '../../../operation/end-for-each';
import { applyOperation } from '../../../util/apply-operation';

const EndForEachSuite = suite('endForEach');

EndForEachSuite('should return the operation data', () => {
  // given
  const context: IOperationContext = {
    currentIndex: -1,
    eventbus: {} as any,
    operations: [],
  };
  const operationData = {};

  // test
  const result = applyOperation(endForEach, operationData, context);

  // expect
  expect(result).to.be.equal(operationData);
});

EndForEachSuite(
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
    applyOperation(endForEach, operationData, context);

    // expect
    expect(context.loopIndex).to.be.equal(2);
    expect(context.loopLength).to.be.equal(10);
    expect(context.loopStartIndex).to.be.equal(5);
    expect(context.newIndex).to.be.equal(5);
  }
);

EndForEachSuite.run();
