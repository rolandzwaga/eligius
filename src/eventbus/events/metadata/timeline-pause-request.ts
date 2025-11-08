import type {PauseRequestEvent} from '../timeline-pause-request.ts';
import type {IEventMetadata} from './types.ts';

export function timelinePauseRequest(): IEventMetadata<
  PauseRequestEvent['args']
> {
  return {
    description: `Event: timeline-pause-request`,
    category: `Timeline`,
    args: [],
  };
}
