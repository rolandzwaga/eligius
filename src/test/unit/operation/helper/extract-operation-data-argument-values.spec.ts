import { expect } from 'chai';
import { suite } from 'uvu';
import { extractOperationDataArgumentValues } from '../../../../operation/helper/extract-operation-data-argument-values';

const ExtractOperationDataArgumentValuesSuite = suite(
  'extractOperationDataArgumentValues'
);

ExtractOperationDataArgumentValuesSuite(
  'should extract the operation data argument values',
  () => {
    // given
    const operationData = {
      extractedValue: 'test',
      operationDataArgument: 'operationdata.extractedValue',
    };

    // test
    const value = extractOperationDataArgumentValues(
      operationData,
      operationData.operationDataArgument
    );

    // expect
    expect(value).to.equal(operationData.extractedValue);
  }
);

ExtractOperationDataArgumentValuesSuite(
  'should return null if argumentValue is null',
  () => {
    // given
    const operationData = {};

    // test
    const value = extractOperationDataArgumentValues(operationData, null);

    // expect
    expect(value).to.be.null;
  }
);

ExtractOperationDataArgumentValuesSuite(
  'should return argumentValue when argumentValue is complex value',
  () => {
    // given
    const operationData = {};
    const arg = {};

    // test
    const value = extractOperationDataArgumentValues(operationData, arg);

    // expect
    expect(value).to.equal(arg);
  }
);

ExtractOperationDataArgumentValuesSuite.run();
