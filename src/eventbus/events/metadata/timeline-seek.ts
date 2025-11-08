import type {SeekEvent} from '../timeline-seek.ts';
import type {IEventMetadata} from './types.ts';

export function timelineSeek(): IEventMetadata<SeekEvent['args']> {
  return {
    description: `Event: timeline-seek`,
    category: `Timeline`,
    args: [],
  };
}
