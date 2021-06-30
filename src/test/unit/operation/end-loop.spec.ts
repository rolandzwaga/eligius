import { expect } from 'chai';
import { endLoop } from '../../../operation/end-loop';
import { applyOperation } from './apply-operation';

describe('endLoop', () => {
  it('should return the operation data', () => {
    // given
    const context = {
      currentIndex: -1,
      eventbus: {} as any,
    };
    const operationData = {};

    // test
    const result = applyOperation(endLoop, operationData, context);

    // expect
    expect(result).to.be.equal(operationData);
  });

  it('should reset if context.skip is true', () => {
    // given
    const context = {
      skipNextOperation: true,
      currentIndex: -1,
      eventbus: {} as any,
    };
    const operationData = {};

    // test
    applyOperation(endLoop, operationData, context);

    // expect
    expect(context.skipNextOperation).to.be.undefined;
  });

  it('should increment loopIndex and restart the newIndex when the current is lower than the loopLength', () => {
    // given
    const context = {
      currentIndex: -1,
      loopIndex: 1,
      loopLength: 10,
      startIndex: 5,
      newIndex: 10,
      eventbus: {} as any,
    };
    const operationData = {};

    // test
    applyOperation(endLoop, operationData, context);

    // expect
    expect(context.loopIndex).to.be.equal(2);
    expect(context.loopLength).to.be.equal(10);
    expect(context.startIndex).to.be.equal(5);
    expect(context.newIndex).to.be.equal(5);
  });

  it('should reset the context when the loopIndex is equal to the loopLength', () => {
    // given
    const context = {
      currentIndex: -1,
      loopIndex: 10,
      loopLength: 10,
      startIndex: 5,
      newIndex: 10,
      eventbus: {} as any,
    };
    const operationData = {};

    // test
    applyOperation(endLoop, operationData, context);

    // expect
    expect(context.loopIndex).to.be.undefined;
    expect(context.loopLength).to.be.undefined;
    expect(context.startIndex).to.be.undefined;
    expect(context.newIndex).to.be.undefined;
  });
});
