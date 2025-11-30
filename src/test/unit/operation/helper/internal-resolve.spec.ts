import {expect, describe, test} from 'vitest';
import {internalResolve} from '../../../../operation/helper/internal-resolve.ts';

describe('internalResolve', () => {
  test('it should call the given resolve with the given operationdata', () => {
    // given
    let receivedData: any = null;
    const resolve = (data: any) => {
      receivedData = data;
    };
    const operationData = {};

    // test
    internalResolve(resolve, operationData);

    // expect
    expect(receivedData).toBe(operationData);
  });
  test('it should call the given resolve with the merged operationdatas', () => {
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
    expect(Object.hasOwn(receivedData, 'test1')).toBe(true);
    expect(Object.hasOwn(receivedData, 'test2')).toBe(true);
    expect(receivedData.test1).toBe(operationData.test1);
    expect(receivedData.test2).toBe(newOperationData.test2);
  });
});
