import { TOperation } from './types';

export interface ISetElementContentOperationData {
  selectedElement: JQuery;
  template: string | JQuery.Node;
  insertionType: 'overwrite' | 'append' | 'prepend';
}

/**
 * This operation sets the specified content defined by the value assigned to the template property
 * to the specified selected element.
 *
 * When the insertionType is set to 'overwrite' the contents of the selected element are replaced
 * by the given template.
 * When set to 'append' the new content will be inserted after the current content.
 * When set to 'prepend' the new content will be inserted before the current content.
 *
 * @param operationData
 * @returns
 */
export const setElementContent: TOperation<ISetElementContentOperationData> =
  function (operationData: ISetElementContentOperationData) {
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

    return operationData;
  };
