import type {RequestInstanceEvent} from '../request-instance.ts';
import type {IEventMetadata} from './types.ts';

export function requestInstance(): IEventMetadata<
  RequestInstanceEvent['args']
> {
  return {
    description: `Event: request-instance`,
    category: `Engine Request`,
    args: [],
  };
}
