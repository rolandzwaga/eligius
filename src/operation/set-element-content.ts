import type {TOperation} from './types.ts';

export interface ISetElementContentOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @erased
   */
  template: string | JQuery.Node;
  /**
   * overwite = the contents of the selected element are replaced by the given template
   *
   * append = the new content will be inserted after the current content
   *
   * prepend = the new content will be inserted before the current content
   * 
   * @erased
   */
  insertionType: 'overwrite' | 'append' | 'prepend';
}

/**
 * This operation sets the specified content defined by the value assigned to the template property
 * to the given selected element.
 *
 * When the `insertionType` is set to `overwrite` the contents of the selected element are replaced
 * by the given template.
 * When set to `append` the new content will be inserted after the current content.
 * When set to `prepend` the new content will be inserted before the current content.
 */
export const setElementContent: TOperation<ISetElementContentOperationData, Omit<ISetElementContentOperationData, 'template'|'insertionType'>> = (
  operationData: ISetElementContentOperationData
) => {
  const {
    insertionType = 'overwrite',
    selectedElement,
    template,
  } = operationData;

  switch (true) {
    case insertionType === 'overwrite':
      selectedElement.html(template);
      break;
    case insertionType === 'append':
      selectedElement.append(template);
      break;
    case insertionType === 'prepend':
      selectedElement.prepend(template);
      break;
  }

  delete (operationData as any).insertionType;
  delete (operationData as any).template;

  return operationData;
};
