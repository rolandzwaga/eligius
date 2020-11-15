import { TOperation } from './types';
export interface IBroadcastEventOperationData {
    eventArgs: any;
    eventTopic?: string;
    eventName: string;
}
export declare const broadcastEvent: TOperation<IBroadcastEventOperationData>;
