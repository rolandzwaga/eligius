import { expect } from 'chai';
import { suite } from 'uvu';
import { mergeOperationData } from '../../../../operation/helper/merge-operation-data';

const MergeOperationDataSuite = suite('mergeOperationData');

MergeOperationDataSuite('should merge the given operation datas', () => {
  // given
  const data1 = {
    test1: 'test1',
  };
  const data2 = {
    test2: 'test2',
  };

  // test
  const newData: any = mergeOperationData(data1, data2);

  // expect
  expect(newData.hasOwnProperty('test1')).to.be.true;
  expect(newData.hasOwnProperty('test2')).to.be.true;
  expect(newData.test1).to.equal('test1');
  expect(newData.test2).to.equal('test2');
});

MergeOperationDataSuite.run();
