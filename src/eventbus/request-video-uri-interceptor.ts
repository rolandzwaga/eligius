import type {EventMap} from '@eventbus/events/types.ts';
import type {IEventbus, IEventbusInterceptor} from '@eventbus/types.ts';

/**
 * Intercepts `request-timeline-uri` and broadcasts
 * `before-request-timeline-uri` with a copy of the same arguments, then
 * passes the arguments on unchanged.
 */
export class RequestVideoUriInterceptor implements IEventbusInterceptor {
  constructor(private eventbus: IEventbus) {}

  intercept(
    args: EventMap['request-timeline-uri']
  ): EventMap['request-timeline-uri'] {
    this.eventbus.broadcast(
      'before-request-timeline-uri',
      args.slice() as EventMap['before-request-timeline-uri']
    );
    return args;
  }
}
