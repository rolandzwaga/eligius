import {TimelineEventNames} from '../timeline-event-names.ts';
import type {IEventbus, IEventbusInterceptor} from './types.ts';

export class RequestVideoUriInterceptor implements IEventbusInterceptor {
  constructor(private eventbus: IEventbus) {}

  intercept(args: any[]): any[] {
    this.eventbus.broadcast(
      TimelineEventNames.BEFORE_REQUEST_TIMELINE_URI,
      args.slice()
    );
    return args;
  }
}
