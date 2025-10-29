import {expect} from 'chai';
import $ from 'jquery';
import {JSDOM} from 'jsdom';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  getTextContent,
  type IGetTextContentOperationData,
} from '../../../operation/get-text-content.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('getTextContent', () => {
  let dom: JSDOM;
  let window: Window;
  let document: Document;
  let mockEventbus: IEventbus;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window as unknown as Window;
    document = window.document;
    (global as any).window = window;
    (global as any).document = document;

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
    expect(result.textContent).to.equal('Hello World!');
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
    expect(result.textContent).to.equal('');
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
    expect(result.textContent).to.contain('First');
    expect(result.textContent).to.contain('Second');
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
    }).to.throw('getTextContent: selectedElement is required');
  });
});
