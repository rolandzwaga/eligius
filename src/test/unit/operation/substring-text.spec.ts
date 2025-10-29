import {expect} from 'chai';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  type ISubstringTextOperationData,
  substringText,
} from '../../../operation/substring-text.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('substringText', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should extract substring', () => {
    const operationData: ISubstringTextOperationData = {
      textContent: 'Hello World',
      start: 0,
      end: 5,
      substring: '',
    };
    const result = applyOperation(substringText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
    expect(result.substring).to.equal('Hello');
  });

  test('should extract substring without end', () => {
    const operationData: ISubstringTextOperationData = {
      textContent: 'Hello World',
      start: 6,
      substring: '',
    };
    const result = applyOperation(substringText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
    expect(result.substring).to.equal('World');
  });

  test('should throw error if textContent not provided', () => {
    const operationData: ISubstringTextOperationData = {
      textContent: null as any,
      start: 0,
      substring: '',
    };
    expect(() => {
      applyOperation(substringText, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).to.throw('textContent is required');
  });
});
