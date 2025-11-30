import type {IEventbus} from '@eventbus/types.ts';
import {
  type ISetFormValueOperationData,
  setFormValue,
} from '@operation/set-form-value.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {JSDOM} from 'jsdom';
import {beforeEach, describe, expect, test} from 'vitest';

describe('setFormValue', () => {
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

  test('should set value of text input', () => {
    // Arrange
    document.body.innerHTML = '<input id="email" name="email" value="" />';
    const $input = $(document).find('#email');
    const operationData: ISetFormValueOperationData = {
      selectedElement: $input as any,
      value: 'test@example.com',
    };

    // Act
    const result = applyOperation(setFormValue, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect($input.val()).toBe('test@example.com');
  });

  test('should set value of select element', () => {
    // Arrange
    document.body.innerHTML = `
      <select id="country">
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
      </select>
    `;
    const $select = $(document).find('#country');
    const operationData: ISetFormValueOperationData = {
      selectedElement: $select as any,
      value: 'uk',
    };

    // Act
    const result = applyOperation(setFormValue, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect($select.val()).toBe('uk');
  });

  test('should set value of textarea', () => {
    // Arrange
    document.body.innerHTML = '<textarea id="comments"></textarea>';
    const $textarea = $(document).find('#comments');
    const operationData: ISetFormValueOperationData = {
      selectedElement: $textarea as any,
      value: 'This is a comment',
    };

    // Act
    const result = applyOperation(setFormValue, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect($textarea.val()).toBe('This is a comment');
  });

  test('should throw error if selectedElement not provided', () => {
    // Arrange
    const operationData: ISetFormValueOperationData = {
      value: 'test',
    } as any;

    // Act & Assert
    expect(() => {
      applyOperation(setFormValue, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('setFormValue: selectedElement is required');
  });

  test('should handle numeric values', () => {
    // Arrange
    document.body.innerHTML = '<input id="age" type="number" />';
    const $input = $(document).find('#age');
    const operationData: ISetFormValueOperationData = {
      selectedElement: $input as any,
      value: 25,
    };

    // Act
    const result = applyOperation(setFormValue, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect($input.val()).toBe('25');
  });

  test('should handle boolean values', () => {
    // Arrange
    document.body.innerHTML = '<input id="accept" type="checkbox" />';
    const $checkbox = $(document).find('#accept');
    const operationData: ISetFormValueOperationData = {
      selectedElement: $checkbox as any,
      value: true,
    };

    // Act
    const result = applyOperation(setFormValue, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect($checkbox.prop('checked')).toBe(true);
  });

  test('should erase value property from operation data', () => {
    // Arrange
    document.body.innerHTML = '<input id="email" />';
    const $input = $(document).find('#email');
    const operationData: ISetFormValueOperationData = {
      selectedElement: $input as any,
      value: 'test@example.com',
    };

    // Act
    applyOperation(setFormValue, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('value' in operationData).toBe(false);
  });
});
