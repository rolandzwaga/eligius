import $ from 'jquery';
import {JSDOM} from 'jsdom';
import {expect, beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  getFormData,
  type IGetFormDataOperationData,
} from '../../../operation/get-form-data.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('getFormData', () => {
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

    // Mock eventbus
    mockEventbus = {
      broadcast: () => {},
    } as any;
  });

  test('should extract form field values into object', () => {
    // Arrange
    document.body.innerHTML = `
      <form id="testForm">
        <input name="email" value="test@example.com" />
        <input name="age" value="25" />
        <select name="country">
          <option value="us" selected>United States</option>
        </select>
      </form>
    `;

    const $form = $(document).find('#testForm');
    const operationData: IGetFormDataOperationData = {
      selectedElement: $form as any,
    };

    // Act
    const result = applyOperation(getFormData, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.formData).toEqual({
      email: 'test@example.com',
      age: '25',
      country: 'us',
    });
  });

  test('should throw error if selectedElement is not provided', () => {
    // Arrange
    const operationData: IGetFormDataOperationData = {} as any;

    // Act & Assert
    expect(() => {
      applyOperation(getFormData, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('getFormData: selectedElement is required');
  });

  test('should throw error if selectedElement is not a form', () => {
    // Arrange
    document.body.innerHTML = '<div id="notForm"></div>';
    const $div = $(document).find('#notForm');
    const operationData: IGetFormDataOperationData = {
      selectedElement: $div as any,
    };

    // Act & Assert
    expect(() => {
      applyOperation(getFormData, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('getFormData: selectedElement must be a form element');
  });

  test('should handle empty form', () => {
    // Arrange
    document.body.innerHTML = '<form id="emptyForm"></form>';
    const $form = $(document).find('#emptyForm');
    const operationData: IGetFormDataOperationData = {
      selectedElement: $form as any,
    };

    // Act
    const result = applyOperation(getFormData, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.formData).toEqual({});
  });

  test('should handle checkboxes and radio buttons', () => {
    // Arrange
    document.body.innerHTML = `
      <form id="testForm">
        <input type="checkbox" name="subscribe" value="yes" checked />
        <input type="radio" name="gender" value="male" checked />
      </form>
    `;

    const $form = $(document).find('#testForm');
    const operationData: IGetFormDataOperationData = {
      selectedElement: $form as any,
    };

    // Act
    const result = applyOperation(getFormData, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.formData).toEqual({
      subscribe: 'yes',
      gender: 'male',
    });
  });

  test('should handle multiple values for same name', () => {
    // Arrange
    document.body.innerHTML = `
      <form id="testForm">
        <input type="checkbox" name="interests" value="sports" checked />
        <input type="checkbox" name="interests" value="music" checked />
        <input name="name" value="John" />
      </form>
    `;

    const $form = $(document).find('#testForm');
    const operationData: IGetFormDataOperationData = {
      selectedElement: $form as any,
    };

    // Act
    const result = applyOperation(getFormData, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.formData!.name).toBe('John');
    // jQuery serializeArray handles multiple values by creating array or taking last value
    expect(result.formData!.interests).to.exist;
  });
});
