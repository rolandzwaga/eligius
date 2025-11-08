import type {CompleteEvent} from '../timeline-complete.ts';
import type {IEventMetadata} from './types.ts';

export function timelineComplete(): IEventMetadata<CompleteEvent['args']> {
  return {
    description: `Event: timeline-complete`,
    category: `Timeline`,
    args: [],
  };
}
