import type {IEventbus, IEventbusInterceptor} from './types.ts';

export class RequestVideoUriInterceptor implements IEventbusInterceptor {
  constructor(private eventbus: IEventbus) {}

  intercept(args: any[]): any[] {
    this.eventbus.broadcast(
      'before-request-timeline-uri',
      args.slice()
    );
    return args;
  }
}
