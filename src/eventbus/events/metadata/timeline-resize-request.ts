import type {ResizeRequestEvent} from '../timeline-resize-request.ts';
import type {IEventMetadata} from './types.ts';

export function timelineResizeRequest(): IEventMetadata<
  ResizeRequestEvent['args']
> {
  return {
    description: `Event: timeline-resize-request`,
    category: `Timeline`,
    args: [],
  };
}
