import type {IEventbus} from '@eventbus/types.ts';
import {
  type IValidateFormOperationData,
  validateForm,
} from '@operation/validate-form.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {beforeEach, describe, expect, test} from 'vitest';

describe('validateForm', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    document.body.innerHTML = '';

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
    expect(result.validationErrors?.email).toBeDefined();
    expect(result.validationErrors?.name).toBeUndefined();
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

  describe('checkboxes, radios and multi-selects', () => {
    function validate(
      html: string,
      validationRules: IValidateFormOperationData['validationRules']
    ) {
      document.body.innerHTML = `<form id="testForm">${html}</form>`;
      return applyOperation(
        validateForm,
        {selectedElement: $('#testForm'), validationRules},
        {currentIndex: 0, eventbus: mockEventbus, operations: []}
      );
    }

    test("given a form with an unchecked checkbox named terms and validationRules {terms: {required: true}}, when validateForm is called, then isValid is false and validationErrors.terms is 'This field is required'", () => {
      const result = validate('<input type="checkbox" name="terms" />', {
        terms: {required: true},
      });

      expect(result.isValid).toBe(false);
      expect(result.validationErrors).toEqual({
        terms: 'This field is required',
      });
    });

    test('given a checked required checkbox, when validateForm is called, then it is valid', () => {
      const result = validate(
        '<input type="checkbox" name="terms" checked />',
        {terms: {required: true, minLength: 5}}
      );

      expect(result.isValid).toBe(true);
    });

    test('given a required radio group where only the last option is checked, when validateForm is called, then the group is valid and validated once', () => {
      const result = validate(
        `<input type="radio" name="size" value="s" />
         <input type="radio" name="size" value="m" />
         <input type="radio" name="size" value="l" checked />`,
        {size: {required: true}}
      );

      expect(result.isValid).toBe(true);
      expect(result.validationErrors).toEqual({});
    });

    test('given a required radio group with nothing checked, when validateForm is called, then the group has one required error', () => {
      const result = validate(
        `<input type="radio" name="size" value="s" />
         <input type="radio" name="size" value="m" />`,
        {size: {required: true}}
      );

      expect(result.validationErrors).toEqual({
        size: 'This field is required',
      });
    });

    test("given a form with a select multiple named tags with no selection and validationRules {tags: {required: true}}, when validateForm is called, then it does not throw and validationErrors.tags is 'This field is required'", () => {
      const result = validate(
        `<select multiple name="tags">
           <option value="a">A</option><option value="b">B</option>
         </select>`,
        {tags: {required: true}}
      );

      expect(result.validationErrors).toEqual({
        tags: 'This field is required',
      });
    });

    test('given a select multiple with one selected option and minLength 2, when validateForm is called, then the error counts selected options', () => {
      const result = validate(
        `<select multiple name="tags">
           <option value="a" selected>A</option><option value="b">B</option>
         </select>`,
        {tags: {required: true, minLength: 2}}
      );

      expect(result.validationErrors).toEqual({
        tags: 'Select at least 2 options',
      });
    });

    test('given a select multiple with two selected options and maxLength 1, when validateForm is called, then the error counts selected options', () => {
      const result = validate(
        `<select multiple name="tags">
           <option value="a" selected>A</option><option value="b" selected>B</option>
         </select>`,
        {tags: {maxLength: 1}}
      );

      expect(result.validationErrors).toEqual({
        tags: 'Select no more than 1 options',
      });
    });

    test('given a select multiple and a pattern, when one selected value does not match, then the format error is reported', () => {
      const result = validate(
        `<select multiple name="tags">
           <option value="a1" selected>A</option><option value="b" selected>B</option>
         </select>`,
        {tags: {pattern: /\d$/g}}
      );

      expect(result.validationErrors).toEqual({tags: 'Invalid format'});
    });

    test('given a field named constructor without rules, when validateForm is called, then no inherited rule applies', () => {
      const result = validate('<input name="constructor" value="" />', {});

      expect(result.isValid).toBe(true);
    });

    test('given a required field named __proto__, when it is empty, then the error is an own key of validationErrors', () => {
      const rules = JSON.parse('{"__proto__": {"required": true}}');
      const result = validate('<input name="__proto__" value="" />', rules);

      expect(Object.hasOwn(result.validationErrors!, '__proto__')).toBe(true);
      expect(Object.getPrototypeOf(result.validationErrors)).toBe(
        Object.prototype
      );
      expect(result.isValid).toBe(false);
    });
  });
});
