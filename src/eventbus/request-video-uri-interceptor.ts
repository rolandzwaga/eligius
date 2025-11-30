import type {IEventbus, IEventbusInterceptor} from '@eventbus/types.ts';

export class RequestVideoUriInterceptor implements IEventbusInterceptor {
  constructor(private eventbus: IEventbus) {}

  intercept(args: any[]): any[] {
    this.eventbus.broadcast('before-request-timeline-uri', args.slice() as any);
    return args;
  }
}
