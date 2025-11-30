import type {IEventbus} from '@eventbus/types.ts';
import {
  type IToggleFormElementOperationData,
  toggleFormElement,
} from '@operation/toggle-form-element.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {JSDOM} from 'jsdom';
import {beforeEach, describe, expect, test} from 'vitest';

describe('toggleFormElement', () => {
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

  test('should disable input element', () => {
    // Arrange
    document.body.innerHTML = '<input id="email" />';
    const $input = $(document).find('#email');
    const operationData: IToggleFormElementOperationData = {
      selectedElement: $input as any,
      enabled: false,
    };

    // Act
    applyOperation(toggleFormElement, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect($input.prop('disabled')).toBe(true);
  });

  test('should enable input element', () => {
    // Arrange
    document.body.innerHTML = '<input id="email" disabled />';
    const $input = $(document).find('#email');
    const operationData: IToggleFormElementOperationData = {
      selectedElement: $input as any,
      enabled: true,
    };

    // Act
    applyOperation(toggleFormElement, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect($input.prop('disabled')).toBe(false);
  });

  test('should disable button element', () => {
    // Arrange
    document.body.innerHTML = '<button id="submit">Submit</button>';
    const $button = $(document).find('#submit');
    const operationData: IToggleFormElementOperationData = {
      selectedElement: $button as any,
      enabled: false,
    };

    // Act
    applyOperation(toggleFormElement, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect($button.prop('disabled')).toBe(true);
  });

  test('should disable select element', () => {
    // Arrange
    document.body.innerHTML =
      '<select id="country"><option value="us">US</option></select>';
    const $select = $(document).find('#country');
    const operationData: IToggleFormElementOperationData = {
      selectedElement: $select as any,
      enabled: false,
    };

    // Act
    applyOperation(toggleFormElement, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect($select.prop('disabled')).toBe(true);
  });

  test('should throw error if selectedElement not provided', () => {
    // Arrange
    const operationData: IToggleFormElementOperationData = {
      enabled: false,
    } as any;

    // Act & Assert
    expect(() => {
      applyOperation(toggleFormElement, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('toggleFormElement: selectedElement is required');
  });

  test('should erase enabled property from operation data', () => {
    // Arrange
    document.body.innerHTML = '<input id="email" />';
    const $input = $(document).find('#email');
    const operationData: IToggleFormElementOperationData = {
      selectedElement: $input as any,
      enabled: false,
    };

    // Act
    applyOperation(toggleFormElement, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('enabled' in operationData).toBe(false);
  });
});
