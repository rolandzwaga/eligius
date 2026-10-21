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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isCheckable(element: Element): element is HTMLInputElement {
  if (element.tagName !== 'INPUT') return false;
  const type = (element as HTMLInputElement).type;
  return type === 'checkbox' || type === 'radio';
}

function toRegExp(pattern: string | RegExp): RegExp {
  return typeof pattern === 'string' ? new RegExp(pattern) : pattern;
}

function matches(pattern: RegExp, value: string): boolean {
  // A global or sticky RegExp keeps lastIndex between test() calls
  pattern.lastIndex = 0;
  return pattern.test(value);
}

/**
 * Applies the rules to a single string value, returns the error message or undefined.
 */
function validateValue(
  value: string,
  rules: IValidationRules
): string | undefined {
  if (rules.required && value.trim() === '') {
    return 'This field is required';
  }
  if (rules.minLength && value.length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters`;
  }
  if (rules.maxLength && value.length > rules.maxLength) {
    return `Must be no more than ${rules.maxLength} characters`;
  }
  if (rules.pattern && !matches(toRegExp(rules.pattern), value)) {
    return 'Invalid format';
  }
  if (rules.email && !emailRegex.test(value)) {
    return 'Must be a valid email address';
  }
  return undefined;
}

/**
 * Applies the rules to the values of a `<select multiple>`: required, minLength and
 * maxLength count the selected options, pattern and email apply to each of them.
 */
function validateSelection(
  values: string[],
  rules: IValidationRules
): string | undefined {
  if (rules.required && values.length === 0) {
    return 'This field is required';
  }
  if (rules.minLength && values.length < rules.minLength) {
    return `Select at least ${rules.minLength} options`;
  }
  if (rules.maxLength && values.length > rules.maxLength) {
    return `Select no more than ${rules.maxLength} options`;
  }
  if (rules.pattern) {
    const pattern = toRegExp(rules.pattern);
    if (values.some(value => !matches(pattern, value))) {
      return 'Invalid format';
    }
  }
  if (rules.email && values.some(value => !emailRegex.test(value))) {
    return 'Must be a valid email address';
  }
  return undefined;
}

/**
 * Validates form fields against HTML5 validation and custom rules.
 *
 * Uses HTML5 validation API (checkValidity()) for native validation, and supports
 * custom validation rules for: required, minLength, maxLength, pattern (regex), and email format.
 *
 * Checkboxes and radio buttons are validated once per name: `required` passes when at least one
 * of them is checked, and the string rules do not apply to them. For a `<select multiple>`,
 * `required`, `minLength` and `maxLength` count the selected options, and `pattern` and `email`
 * apply to each selected value.
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
  // defineProperty, so a field named '__proto__' becomes an own key instead of
  // replacing the result's prototype
  const setError = (name: string, message: string) => {
    Object.defineProperty(validationErrors, name, {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  };

  // Get all form inputs
  const inputs = selectedElement.find('input, select, textarea');
  // Checkbox and radio groups are validated once per name
  const handledGroups = new Set<string>();

  inputs.each((_, element) => {
    const $input = $(element);
    const name = $input.attr('name');

    if (!name) return; // Skip inputs without name attribute

    // Only own entries count, so a field named e.g. 'constructor' gets no inherited rules
    const rules =
      validationRules && Object.hasOwn(validationRules, name)
        ? validationRules[name]
        : undefined;

    if (isCheckable(element)) {
      if (handledGroups.has(name)) return;
      handledGroups.add(name);

      const group = inputs
        .toArray()
        .filter(
          other => isCheckable(other) && other.getAttribute('name') === name
        ) as HTMLInputElement[];

      const invalid = group.find(
        input => input.checkValidity && !input.checkValidity()
      );
      if (invalid) {
        setError(name, invalid.validationMessage || 'Invalid value');
        return;
      }

      // A checkbox or radio is filled in when one of its group is checked; its value
      // attribute ('on' by default) says nothing about that, so string rules do not apply
      if (rules?.required && !group.some(input => input.checked)) {
        setError(name, 'This field is required');
      }
      return;
    }

    // HTML5 validation first
    const inputElement = element as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    if (inputElement.checkValidity && !inputElement.checkValidity()) {
      setError(name, inputElement.validationMessage || 'Invalid value');
      return;
    }

    // Custom validation rules
    if (!rules) return;

    const raw = $input.val();
    const error = Array.isArray(raw)
      ? validateSelection(raw.map(String), rules)
      : validateValue(raw == null ? '' : String(raw), rules);
    if (error) {
      setError(name, error);
    }
  });

  operationData.validationErrors = validationErrors;
  operationData.isValid = Object.keys(validationErrors).length === 0;

  removeProperties(operationData, 'validationRules');

  return operationData;
};
