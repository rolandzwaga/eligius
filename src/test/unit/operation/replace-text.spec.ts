import {expect} from 'chai';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  type IReplaceTextOperationData,
  replaceText,
} from '../../../operation/replace-text.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('replaceText', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;
  });

  test('should replace text with literal string', () => {
    // Arrange
    const operationData: IReplaceTextOperationData = {
      textContent: 'Hello {{name}}!',
      searchPattern: '{{name}}',
      replacement: 'John',
      replacementCount: 0,
    };

    // Act
    const result = applyOperation(replaceText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.textContent).to.equal('Hello John!');
    expect(result.replacementCount).to.equal(1);
  });

  test('should replace with regex pattern', () => {
    // Arrange
    const operationData: IReplaceTextOperationData = {
      textContent: 'Test 123 and 456',
      searchPattern: /\d+/g,
      replacement: 'NUM',
      replacementCount: 0,
    };

    // Act
    const result = applyOperation(replaceText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.textContent).to.equal('Test NUM and NUM');
    expect(result.replacementCount).to.equal(2);
  });

  test('should handle no matches', () => {
    // Arrange
    const operationData: IReplaceTextOperationData = {
      textContent: 'Hello World',
      searchPattern: 'notfound',
      replacement: 'replaced',
      replacementCount: 0,
    };

    // Act
    const result = applyOperation(replaceText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.textContent).to.equal('Hello World');
    expect(result.replacementCount).to.equal(0);
  });

  test('should throw error if textContent not provided', () => {
    // Arrange
    const operationData: IReplaceTextOperationData = {
      textContent: null as any,
      searchPattern: 'test',
      replacement: 'replaced',
      replacementCount: 0,
    };

    // Act & Assert
    expect(() => {
      applyOperation(replaceText, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).to.throw('replaceText: textContent is required');
  });

  test('should erase search properties', () => {
    // Arrange
    const operationData: IReplaceTextOperationData = {
      textContent: 'Test',
      searchPattern: 'Test',
      replacement: 'Result',
      replacementCount: 0,
    };

    // Act
    applyOperation(replaceText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('searchPattern' in operationData).to.be.false;
    expect('replacement' in operationData).to.be.false;
  });
});
