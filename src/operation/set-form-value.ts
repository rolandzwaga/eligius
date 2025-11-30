import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface ISetFormValueOperationData {
  /**
   * @required
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @required
   * @erased
   */
  value: string | number | boolean;
}

/**
 * Sets the value of an input, select, or textarea element.
 *
 * Handles different input types appropriately:
 * - Text inputs, textareas, selects: sets value directly
 * - Checkboxes: sets checked property for boolean values
 * - Radio buttons: sets checked property for boolean values
 * - Number inputs: converts to string
 *
 * @example
 * ```typescript
 * // Set text input value
 * const result = setFormValue({selectedElement: $input, value: 'test@example.com'});
 * // Element value is now 'test@example.com'
 * ```
 *
 * @example
 * ```typescript
 * // Set checkbox checked state
 * const result = setFormValue({selectedElement: $checkbox, value: true});
 * // Checkbox is now checked
 * ```
 *
 * @category Form
 */
export const setFormValue: TOperation<
  ISetFormValueOperationData,
  Omit<ISetFormValueOperationData, 'value'>
> = (operationData: ISetFormValueOperationData) => {
  const {selectedElement, value} = operationData;

  // Validate selectedElement exists
  if (!selectedElement || selectedElement.length === 0) {
    throw new Error('setFormValue: selectedElement is required');
  }

  // Handle checkboxes and radio buttons with boolean values
  if (
    typeof value === 'boolean' &&
    (selectedElement.is(':checkbox') || selectedElement.is(':radio'))
  ) {
    selectedElement.prop('checked', value);
  } else {
    // Handle all other inputs with val()
    selectedElement.val(value as any);
  }

  removeProperties(operationData, 'value');

  return operationData;
};
