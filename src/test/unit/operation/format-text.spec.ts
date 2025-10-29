import {expect} from 'chai';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  formatText,
  type IFormatTextOperationData,
} from '../../../operation/format-text.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('formatText', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;
  });

  test('should format text to uppercase', () => {
    // Arrange
    const operationData: IFormatTextOperationData = {
      textContent: 'hello world',
      transformation: 'uppercase',
      formattedText: '',
    };

    // Act
    const result = applyOperation(formatText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.formattedText).to.equal('HELLO WORLD');
  });

  test('should format text to lowercase', () => {
    // Arrange
    const operationData: IFormatTextOperationData = {
      textContent: 'HELLO WORLD',
      transformation: 'lowercase',
      formattedText: '',
    };

    // Act
    const result = applyOperation(formatText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.formattedText).to.equal('hello world');
  });

  test('should capitalize first letter', () => {
    // Arrange
    const operationData: IFormatTextOperationData = {
      textContent: 'hello world',
      transformation: 'capitalize',
      formattedText: '',
    };

    // Act
    const result = applyOperation(formatText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.formattedText).to.equal('Hello world');
  });

  test('should format text to titlecase', () => {
    // Arrange
    const operationData: IFormatTextOperationData = {
      textContent: 'hello world test',
      transformation: 'titlecase',
      formattedText: '',
    };

    // Act
    const result = applyOperation(formatText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.formattedText).to.equal('Hello World Test');
  });

  test('should trim whitespace', () => {
    // Arrange
    const operationData: IFormatTextOperationData = {
      textContent: '  hello world  ',
      transformation: 'trim',
      formattedText: '',
    };

    // Act
    const result = applyOperation(formatText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.formattedText).to.equal('hello world');
  });

  test('should throw error for unknown transformation', () => {
    // Arrange
    const operationData: IFormatTextOperationData = {
      textContent: 'test',
      transformation: 'unknown' as any,
      formattedText: '',
    };

    // Act & Assert
    expect(() => {
      applyOperation(formatText, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).to.throw('formatText: unknown transformation type "unknown"');
  });

  test('should throw error if textContent not provided', () => {
    // Arrange
    const operationData: IFormatTextOperationData = {
      textContent: null as any,
      transformation: 'uppercase',
      formattedText: '',
    };

    // Act & Assert
    expect(() => {
      applyOperation(formatText, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).to.throw('formatText: textContent is required');
  });

  test('should erase transformation property', () => {
    // Arrange
    const operationData: IFormatTextOperationData = {
      textContent: 'test',
      transformation: 'uppercase',
      formattedText: '',
    };

    // Act
    applyOperation(formatText, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('transformation' in operationData).to.be.false;
  });
});
