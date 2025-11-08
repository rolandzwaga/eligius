import { type RequestLabelCollectionEvent } from "../request-label-collection.ts";
import { type IEventMetadata } from "./types.ts";

export function requestLabelCollection(): IEventMetadata<RequestLabelCollectionEvent['args']> {
  return {
    description: `Event: request-label-collection`,
    category: `Engine Request`,
    args: [
      {
        name: 'language',
        type: 'string'
      },
      {
        name: 'callback',
        type: '(collection: any) => void'
      }]
  };
}
