import {expect} from 'chai';
import {describe, test} from 'vitest';
import {mergeOperationData} from '../../../../operation/helper/merge-operation-data.ts';
import type {TOperationData} from '../../../../operation/types.ts';

describe.concurrent('mergeOperationData', () => {
  test('should merge the given operation datas', () => {
    // given
    const data1 = {
      test1: 'test1',
    };
    const data2 = {
      test2: 'test2',
    };

    // test
    const newData: TOperationData = mergeOperationData(data1, data2);

    // expect
    expect(Object.hasOwn(newData, 'test1')).to.be.true;
    expect(Object.hasOwn(newData, 'test2')).to.be.true;
    expect(newData.test1).to.equal('test1');
    expect(newData.test2).to.equal('test2');
  });
});
