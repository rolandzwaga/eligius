import { IEventInterceptor, IEventbus } from './types';
declare class RequestVideoUriInterceptor implements IEventInterceptor {
    private eventbus;
    constructor(eventbus: IEventbus);
    intercept(args: any[]): any[];
}
export default RequestVideoUriInterceptor;
