import { expect } from 'chai';
import { startLoop } from '~/operation/start-loop';
import { IOperationContext } from '~/operation/types';

describe('startLoop', () => {
  it('should set the context when a valid collection is passed in', () => {
    // given
    const context: IOperationContext = {
      currentIndex: 10,
    };
    const operationData = {
      collection: [1, 2, 3, 4],
      propertyName: 'test',
    };

    // test
    const result = startLoop.call(context, operationData);

    // expect
    expect(context.loopIndex).to.equal(0);
    expect(context.loopLength).to.equal(3);
    expect(context.startIndex).to.equal(10);
    expect(result.test).to.equal(1);
  });

  it('should set the context when an empty collection is passed in', () => {
    // given
    const context: IOperationContext = {
      currentIndex: 10,
    };
    const operationData = {
      collection: [],
      propertyName: 'test',
    };

    // test
    const result = startLoop.call(context, operationData);

    // expect
    expect(context.loopIndex).to.be.undefined;
    expect(context.loopLength).to.be.undefined;
    expect(context.startIndex).to.be.undefined;
    expect(context.skipNextOperation).to.be.true;
    expect(result.test).to.be.undefined;
  });

  it('should set the context when a null collection is passed in', () => {
    // given
    const context: IOperationContext = {
      currentIndex: 10,
    };
    const operationData = {
      collection: null,
      propertyName: 'test',
    };

    // test
    const result = startLoop.call(context, operationData);

    // expect
    expect(context.loopIndex).to.be.undefined;
    expect(context.loopLength).to.be.undefined;
    expect(context.startIndex).to.be.undefined;
    expect(context.skipNextOperation).to.be.true;
    expect(result.test).to.be.undefined;
  });
});
