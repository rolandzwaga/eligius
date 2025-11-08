import type {RequestTimelineUriEvent} from '../request-timeline-uri.ts';
import type {IEventMetadata} from './types.ts';

export function requestTimelineUri(): IEventMetadata<
  RequestTimelineUriEvent['args']
> {
  return {
    description: `Event: request-timeline-uri`,
    category: `Engine Request`,
    args: [],
  };
}
