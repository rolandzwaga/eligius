import type {TimeEvent} from '../timeline-time.ts';
import type {IEventMetadata} from './types.ts';

export function timelineTime(): IEventMetadata<TimeEvent['args']> {
  return {
    description: `Event: timeline-time`,
    category: `Timeline`,
    args: [],
  };
}
