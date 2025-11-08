import type {SeekedEvent} from '../timeline-seeked.ts';
import type {IEventMetadata} from './types.ts';

export function timelineSeeked(): IEventMetadata<SeekedEvent['args']> {
  return {
    description: `Event: timeline-seeked`,
    category: `Timeline`,
    args: [],
  };
}
