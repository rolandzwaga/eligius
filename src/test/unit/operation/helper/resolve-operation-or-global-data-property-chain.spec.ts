import { expect } from 'chai';
import { suite } from 'uvu';
import { resolveOperationOrGlobalDataPropertyChain } from '../../../../operation/helper/resolve-operation-or-global-data-property-chain';

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
    const value = resolveOperationOrGlobalDataPropertyChain(
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
    const value = resolveOperationOrGlobalDataPropertyChain(
      operationData,
      null
    );

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
    const value = resolveOperationOrGlobalDataPropertyChain(operationData, arg);

    // expect
    expect(value).to.equal(arg);
  }
);

ExtractOperationDataArgumentValuesSuite.run();
