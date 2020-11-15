import { IEventbus, IEventbusInterceptor } from './types';
export declare class RequestVideoUriInterceptor implements IEventbusInterceptor {
    private eventbus;
    constructor(eventbus: IEventbus);
    intercept(args: any[]): any[];
}
