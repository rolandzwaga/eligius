import type {StopRequestEvent} from '../timeline-stop-request.ts';
import type {IEventMetadata} from './types.ts';

export function timelineStopRequest(): IEventMetadata<
  StopRequestEvent['args']
> {
  return {
    description: `Event: timeline-stop-request`,
    category: `Timeline`,
    args: [],
  };
}
