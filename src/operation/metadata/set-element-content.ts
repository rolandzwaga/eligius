import { ISetElementContentOperationData } from '../../operation/set-element-content';
import { IOperationMetadata } from './types';

function setElementContent(): IOperationMetadata<
  ISetElementContentOperationData
> {
  return {
    description: 'Sets the given HTML content in the selected element',
    dependentProperties: ['selectedElement', 'template'],
    properties: {
      insertionType: [
        {
          value: 'overwrite',
          description:
            'the contents of the selected element are replaced by the given template',
          default: true,
        },
        {
          value: 'append',
          description:
            'the new content will be inserted after the current content',
        },
        {
          value: 'prepend',
          description:
            'the new content will be inserted before the current content',
        },
      ],
    },
  };
}
export default setElementContent;
