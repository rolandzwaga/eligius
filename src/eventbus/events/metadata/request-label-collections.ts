import type {RequestLabelCollectionsEvent} from '../request-label-collections.ts';
import type {IEventMetadata} from './types.ts';

export function requestLabelCollections(): IEventMetadata<
  RequestLabelCollectionsEvent['args']
> {
  return {
    description: `Event: request-label-collections`,
    category: `Engine Request`,
    args: [
      {
        name: 'callback',
        type: '(collections: any) => void',
      },
    ],
  };
}
