import {expect} from 'chai';
import $ from 'jquery';
import {JSDOM} from 'jsdom';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  type IValidateFormOperationData,
  validateForm,
} from '../../../operation/validate-form.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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
    expect(result.isValid).to.be.false;
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
    expect(result.isValid).to.be.true;
    expect(result.validationErrors).to.deep.equal({});
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
    expect(result.isValid).to.be.false;
    expect(result.validationErrors?.password).to.contain(
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
    expect(result.isValid).to.be.false;
    expect(result.validationErrors?.email).to.contain('valid email');
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
    }).to.throw('validateForm: selectedElement is required');
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
    expect('validationRules' in operationData).to.be.false;
  });
});
