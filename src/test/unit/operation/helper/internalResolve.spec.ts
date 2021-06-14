import { expect } from 'chai';
import { internalResolve } from '../../../../operation/helper/internal-resolve';

describe('internalResolve', () => {
  it('it should call the given resolve with the given operationdata', () => {
    // given
    let receivedData = null;
    const resolve = data => {
      receivedData = data;
    };
    const operationData = {};

    // test
    internalResolve(resolve, operationData);

    // expect
    expect(receivedData).to.equal(operationData);
  });

  it('it should call the given resolve with the merged operationdatas', () => {
    // given
    let receivedData = null;
    const resolve = data => {
      receivedData = data;
    };
    const operationData = {
      test1: 'test1',
    };
    const newOperationData = {
      test2: 'test2',
    };

    // test
    internalResolve(resolve, operationData, newOperationData);

    // expect
    expect(receivedData.hasOwnProperty('test1')).to.be.true;
    expect(receivedData.hasOwnProperty('test2')).to.be.true;
    expect(receivedData.test1).to.be.equal(operationData.test1);
    expect(receivedData.test2).to.be.equal(newOperationData.test2);
  });
});
