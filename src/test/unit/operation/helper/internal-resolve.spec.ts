import { expect } from 'chai';
import { suite } from 'uvu';
import { internalResolve } from '../../../../operation/helper/internal-resolve.ts';

const InternalResolveSuite = suite('internalResolve');

InternalResolveSuite(
  'it should call the given resolve with the given operationdata',
  () => {
    // given
    let receivedData: any = null;
    const resolve = (data: any) => {
      receivedData = data;
    };
    const operationData = {};

    // test
    internalResolve(resolve, operationData);

    // expect
    expect(receivedData).to.equal(operationData);
  }
);

InternalResolveSuite(
  'it should call the given resolve with the merged operationdatas',
  () => {
    // given
    let receivedData: any = null;
    const resolve = (data: any) => {
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
  }
);

InternalResolveSuite.run();
