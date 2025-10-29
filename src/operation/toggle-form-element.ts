import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

export interface IToggleFormElementOperationData {
  /**
   * @required
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @required
   * @erased
   */
  enabled: boolean;
}

/**
 * Enables or disables form input elements (inputs, selects, textareas, buttons).
 *
 * Sets the `disabled` property on the element. When `enabled` is true, removes the disabled
 * attribute; when false, adds the disabled attribute.
 *
 * @example
 * ```typescript
 * // Disable an input field
 * toggleFormElement({selectedElement: $input, enabled: false});
 * // Input is now disabled
 * ```
 *
 * @example
 * ```typescript
 * // Enable a previously disabled button
 * toggleFormElement({selectedElement: $button, enabled: true});
 * // Button is now enabled
 * ```
 *
 * @category Form
 */
export const toggleFormElement: TOperation<
  IToggleFormElementOperationData,
  Omit<IToggleFormElementOperationData, 'enabled'>
> = (operationData: IToggleFormElementOperationData) => {
  const {selectedElement, enabled} = operationData;

  if (!selectedElement || selectedElement.length === 0) {
    throw new Error('toggleFormElement: selectedElement is required');
  }

  // Set disabled property (disabled = !enabled)
  selectedElement.prop('disabled', !enabled);

  removeProperties(operationData, 'enabled');

  return operationData;
};
