import type {IEventbus} from '@eventbus/types.ts';
import {
  getTextContent,
  type IGetTextContentOperationData,
} from '@operation/get-text-content.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {beforeEach, describe, expect, test} from 'vitest';

describe('getTextContent', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    document.body.innerHTML = '';

    mockEventbus = {
      broadcast: () => {},
    } as any;
  });

  test('should extract text content stripping HTML', () => {
    // Arrange
    document.body.innerHTML =
      '<div id="content">Hello <strong>World</strong>!</div>';
    const $div = $(document).find('#content');
    const operationData: IGetTextContentOperationData = {
      selectedElement: $div as any,
    };

    // Act
    const result = applyOperation(getTextContent, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.textContent).toBe('Hello World!');
  });

  test('should handle empty elements', () => {
    // Arrange
    document.body.innerHTML = '<div id="content"></div>';
    const $div = $(document).find('#content');
    const operationData: IGetTextContentOperationData = {
      selectedElement: $div as any,
    };

    // Act
    const result = applyOperation(getTextContent, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.textContent).toBe('');
  });

  test('should handle nested HTML', () => {
    // Arrange
    document.body.innerHTML =
      '<div id="content"><p>First</p><p>Second</p></div>';
    const $div = $(document).find('#content');
    const operationData: IGetTextContentOperationData = {
      selectedElement: $div as any,
    };

    // Act
    const result = applyOperation(getTextContent, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.textContent).toContain('First');
    expect(result.textContent).toContain('Second');
  });

  test('should throw error if selectedElement not provided', () => {
    // Arrange
    const operationData: IGetTextContentOperationData = {} as any;

    // Act & Assert
    expect(() => {
      applyOperation(getTextContent, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('getTextContent: selectedElement is required');
  });
});
