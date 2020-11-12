import { expect } from 'chai';
import { extractOperationDataArgumentValues } from '~/operation/helper/extract-operation-data-argument-values';

describe('extractOperationDataArgumentValues', () => {
  it('should extract the operation data argument values', () => {
    // given
    const operationData = {
      extractedValue: 'test',
      operationDataArgument: 'operationdata.extractedValue',
    };

    // test
    const value = extractOperationDataArgumentValues(operationData, operationData.operationDataArgument);

    // expect
    expect(value).to.equal(operationData.extractedValue);
  });

  it('should return null if argumentValue is null', () => {
    // given
    const operationData = {};

    // test
    const value = extractOperationDataArgumentValues(operationData, null);

    // expect
    expect(value).to.be.null;
  });

  it('should return argumentValue when argumentValue is complex value', () => {
    // given
    const operationData = {};
    const arg = {};

    // test
    const value = extractOperationDataArgumentValues(operationData, arg);

    // expect
    expect(value).to.equal(arg);
  });
});
