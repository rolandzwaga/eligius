import {expect} from 'chai';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  concatenateStrings,
  type IConcatenateStringsOperationData,
} from '../../../operation/concatenate-strings.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('concatenateStrings', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should concatenate strings without separator', () => {
    const operationData: IConcatenateStringsOperationData = {
      strings: ['Hello', 'World'],
      result: '',
    };
    const result = applyOperation(concatenateStrings, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
    expect(result.result).to.equal('HelloWorld');
  });

  test('should concatenate strings with separator', () => {
    const operationData: IConcatenateStringsOperationData = {
      strings: ['apple', 'banana', 'cherry'],
      separator: ', ',
      result: '',
    };
    const result = applyOperation(concatenateStrings, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
    expect(result.result).to.equal('apple, banana, cherry');
  });

  test('should throw error if strings not an array', () => {
    const operationData: IConcatenateStringsOperationData = {
      strings: null as any,
      result: '',
    };
    expect(() => {
      applyOperation(concatenateStrings, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).to.throw('strings must be an array');
  });

  test('should erase strings and separator properties', () => {
    const operationData: IConcatenateStringsOperationData = {
      strings: ['a', 'b'],
      separator: '-',
      result: '',
    };
    applyOperation(concatenateStrings, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
    expect('strings' in operationData).to.be.false;
    expect('separator' in operationData).to.be.false;
  });
});
