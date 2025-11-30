import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';
import $ from 'jquery';

export interface IValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
  email?: boolean;
}

export interface IValidateFormOperationData {
  /**
   * @required
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @erased
   */
  validationRules?: Record<string, IValidationRules>;
  /**
   * @output
   * @type=ParameterType:object
   */
  validationErrors?: Record<string, string>;
  /**
   * @output
   */
  isValid?: boolean;
}

/**
 * Validates form fields against HTML5 validation and custom rules.
 *
 * Uses HTML5 validation API (checkValidity()) for native validation, and supports
 * custom validation rules for: required, minLength, maxLength, pattern (regex), and email format.
 *
 * @returns Operation data with `validationErrors` object (field names → error messages) and `isValid` boolean
 *
 * @example
 * ```typescript
 * // Validate with HTML5 validation
 * const result = validateForm({selectedElement: $form});
 * // Returns: {isValid: true, validationErrors: {}}
 * ```
 *
 * @example
 * ```typescript
 * // Validate with custom rules
 * const result = validateForm({
 *   selectedElement: $form,
 *   validationRules: {
 *     password: { required: true, minLength: 8 },
 *     email: { email: true }
 *   }
 * });
 * // Returns: {isValid: false, validationErrors: {password: "Must be at least 8 characters"}}
 * ```
 *
 * @category Form
 */
export const validateForm: TOperation<
  IValidateFormOperationData,
  Omit<IValidateFormOperationData, 'validationRules'>
> = (operationData: IValidateFormOperationData) => {
  const {selectedElement, validationRules} = operationData;

  if (!selectedElement || selectedElement.length === 0) {
    throw new Error('validateForm: selectedElement is required');
  }

  if (!selectedElement.is('form')) {
    throw new Error('validateForm: selectedElement must be a form element');
  }

  const validationErrors: Record<string, string> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Get all form inputs
  const inputs = selectedElement.find('input, select, textarea');

  inputs.each((_, element) => {
    const $input = $(element);
    const name = $input.attr('name');

    if (!name) return; // Skip inputs without name attribute

    const value = $input.val() as string;
    const rules = validationRules?.[name];

    // HTML5 validation first
    const inputElement = element as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    if (inputElement.checkValidity && !inputElement.checkValidity()) {
      validationErrors[name] =
        inputElement.validationMessage || 'Invalid value';
      return;
    }

    // Custom validation rules
    if (rules) {
      if (rules.required && (!value || value.trim() === '')) {
        validationErrors[name] = 'This field is required';
        return;
      }

      if (rules.minLength && value.length < rules.minLength) {
        validationErrors[name] =
          `Must be at least ${rules.minLength} characters`;
        return;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        validationErrors[name] =
          `Must be no more than ${rules.maxLength} characters`;
        return;
      }

      if (rules.pattern) {
        const pattern =
          typeof rules.pattern === 'string'
            ? new RegExp(rules.pattern)
            : rules.pattern;
        if (!pattern.test(value)) {
          validationErrors[name] = 'Invalid format';
          return;
        }
      }

      if (rules.email && !emailRegex.test(value)) {
        validationErrors[name] = 'Must be a valid email address';
        return;
      }
    }
  });

  operationData.validationErrors = validationErrors;
  operationData.isValid = Object.keys(validationErrors).length === 0;

  removeProperties(operationData, 'validationRules');

  return operationData;
};
