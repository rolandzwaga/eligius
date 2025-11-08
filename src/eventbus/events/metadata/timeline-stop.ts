import type {StopEvent} from '../timeline-stop.ts';
import type {IEventMetadata} from './types.ts';

export function timelineStop(): IEventMetadata<StopEvent['args']> {
  return {
    description: `Event: timeline-stop`,
    category: `Timeline`,
    args: [],
  };
}
