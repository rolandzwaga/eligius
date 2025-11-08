import type {DurationRequestEvent} from '../timeline-duration-request.ts';
import type {IEventMetadata} from './types.ts';

export function timelineDurationRequest(): IEventMetadata<
  DurationRequestEvent['args']
> {
  return {
    description: `Event: timeline-duration-request`,
    category: `Timeline`,
    args: [
      {
        name: 'callback',
        type: '(duration: number) => void',
      },
    ],
  };
}
