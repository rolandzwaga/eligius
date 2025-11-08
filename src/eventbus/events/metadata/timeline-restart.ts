import type {RestartEvent} from '../timeline-restart.ts';
import type {IEventMetadata} from './types.ts';

export function timelineRestart(): IEventMetadata<RestartEvent['args']> {
  return {
    description: `Event: timeline-restart`,
    category: `Timeline`,
    args: [],
  };
}
