import type {IEventbus} from '@eventbus/types.ts';
import {
  type IValidateFormOperationData,
  validateForm,
} from '@operation/validate-form.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {JSDOM} from 'jsdom';
import {beforeEach, describe, expect, test} from 'vitest';

describe('validateForm', () => {
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

  test('should validate required fields', () => {
    // Arrange
    document.body.innerHTML = `
      <form id="testForm">
        <input name="email" value="" required />
        <input name="name" value="John" required />
      </form>
    `;

    const $form = $(document).find('#testForm');
    const operationData: IValidateFormOperationData = {
      selectedElement: $form as any,
    };

    // Act
    const result = applyOperation(validateForm, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.validationErrors?.email).to.exist;
    expect(result.validationErrors?.name).to.not.exist;
  });

  test('should validate all fields as valid', () => {
    // Arrange
    document.body.innerHTML = `
      <form id="testForm">
        <input name="email" value="test@example.com" required />
        <input name="name" value="John" required />
      </form>
    `;

    const $form = $(document).find('#testForm');
    const operationData: IValidateFormOperationData = {
      selectedElement: $form as any,
    };

    // Act
    const result = applyOperation(validateForm, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toEqual({});
  });

  test('should validate with custom rules', () => {
    // Arrange
    document.body.innerHTML = `
      <form id="testForm">
        <input name="password" value="123" />
      </form>
    `;

    const $form = $(document).find('#testForm');
    const operationData: IValidateFormOperationData = {
      selectedElement: $form as any,
      validationRules: {
        password: {
          minLength: 8,
        },
      },
    };

    // Act
    const result = applyOperation(validateForm, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.validationErrors?.password).toContain(
      'at least 8 characters'
    );
  });

  test('should validate email pattern', () => {
    // Arrange
    document.body.innerHTML = `
      <form id="testForm">
        <input name="email" value="invalid-email" />
      </form>
    `;

    const $form = $(document).find('#testForm');
    const operationData: IValidateFormOperationData = {
      selectedElement: $form as any,
      validationRules: {
        email: {
          email: true,
        },
      },
    };

    // Act
    const result = applyOperation(validateForm, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.validationErrors?.email).toContain('valid email');
  });

  test('should throw error if selectedElement not provided', () => {
    // Arrange
    const operationData: IValidateFormOperationData = {} as any;

    // Act & Assert
    expect(() => {
      applyOperation(validateForm, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('validateForm: selectedElement is required');
  });

  test('should erase validationRules from operation data', () => {
    // Arrange
    document.body.innerHTML =
      '<form id="testForm"><input name="email" value="test@example.com" /></form>';
    const $form = $(document).find('#testForm');
    const operationData: IValidateFormOperationData = {
      selectedElement: $form as any,
      validationRules: {
        email: {required: true},
      },
    };

    // Act
    applyOperation(validateForm, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('validationRules' in operationData).toBe(false);
  });
});
