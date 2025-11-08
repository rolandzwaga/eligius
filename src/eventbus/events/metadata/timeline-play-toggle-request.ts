import type {PlayToggleRequestEvent} from '../timeline-play-toggle-request.ts';
import type {IEventMetadata} from './types.ts';

export function timelinePlayToggleRequest(): IEventMetadata<
  PlayToggleRequestEvent['args']
> {
  return {
    description: `Event: timeline-play-toggle-request`,
    category: `Timeline`,
    args: [],
  };
}
