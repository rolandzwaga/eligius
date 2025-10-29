/**
 * TypeScript interfaces for Form Operations
 *
 * @packageDocumentation
 */

/**
 * Operation data for getFormData operation.
 * Extracts all input, select, and textarea values from form element.
 */
export interface IGetFormDataOperationData {
  /** CSS selector for form element */
  selector?: string;
  /** Pre-selected form element (jQuery) */
  selectedElement?: any;
  /** Extracted form data as object (output) */
  formData?: Record<string, any>;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for setFormValue operation.
 * Sets value of input/select/textarea element.
 */
export interface ISetFormValueOperationData {
  /** CSS selector for input element */
  selector?: string;
  /** Pre-selected input element (jQuery) */
  selectedElement?: any;
  /** Value to set */
  value: string | number | boolean;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Validation rules for form fields.
 */
export interface IValidationRules {
  /** Field is required */
  required?: boolean;
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** Regex pattern to match */
  pattern?: string | RegExp;
  /** Validate as email format */
  email?: boolean;
}

/**
 * Operation data for validateForm operation.
 * Validates form fields against rules.
 */
export interface IValidateFormOperationData {
  /** CSS selector for form element */
  selector?: string;
  /** Pre-selected form element (jQuery) */
  selectedElement?: any;
  /** Custom validation rules (optional) */
  validationRules?: Record<string, IValidationRules>;
  /** Validation errors by field name (output) */
  validationErrors?: Record<string, string>;
  /** True if all fields valid (output) */
  isValid?: boolean;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for toggleFormElement operation.
 * Enables or disables form input elements.
 */
export interface IToggleFormElementOperationData {
  /** CSS selector for input element */
  selector?: string;
  /** Pre-selected input element (jQuery) */
  selectedElement?: any;
  /** True to enable, false to disable */
  enabled: boolean;
  /** Error message if operation failed (output) */
  error?: string;
}
