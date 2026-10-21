import type {TOperation} from '@operation/types.ts';

export interface IGetFormDataOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @output
   * @type=ParameterType:object
   */
  formData?: Record<string, any>;
}

function defineField(target: Record<string, any>, name: string, value: any) {
  Object.defineProperty(target, name, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

/**
 * Extracts all input, select, and textarea values from form element into operation data.
 *
 * This operation reads form field values and returns them as an object with field names as keys.
 * Only processes form elements that are enabled and not hidden. Handles checkboxes, radio buttons,
 * select elements, textareas, and text inputs.
 *
 * @returns Operation data with `formData` object containing field values
 *
 * @example
 * ```typescript
 * // Given a form with fields: name="John", email="john@example.com"
 * const result = getFormData({selectedElement: $form});
 * // Returns: {selectedElement: $form, formData: {name: "John", email: "john@example.com"}}
 * ```
 *
 * @category Form
 */
export const getFormData: TOperation<
  IGetFormDataOperationData,
  IGetFormDataOperationData
> = (operationData: IGetFormDataOperationData) => {
  const {selectedElement} = operationData;

  // Validate selectedElement exists
  if (!selectedElement || selectedElement.length === 0) {
    throw new Error('getFormData: selectedElement is required');
  }

  // Validate selectedElement is a form
  if (!selectedElement.is('form')) {
    throw new Error('getFormData: selectedElement must be a form element');
  }

  // Use jQuery's serializeArray to get form data
  const formArray = selectedElement.serializeArray();
  const formData: Record<string, any> = {};

  // Convert array format to object format. Only own keys count, and values are
  // defined rather than assigned, so field names like 'constructor' or '__proto__'
  // neither merge with inherited members nor replace the prototype.
  for (const field of formArray) {
    if (Object.hasOwn(formData, field.name)) {
      // Handle multiple values for same name (checkboxes)
      const existing = formData[field.name];
      if (Array.isArray(existing)) {
        existing.push(field.value);
      } else {
        defineField(formData, field.name, [existing, field.value]);
      }
    } else {
      defineField(formData, field.name, field.value);
    }
  }

  operationData.formData = formData;

  return operationData;
};
