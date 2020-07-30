import { TOperation } from '../action/types';
export interface IBroadcastEventOperationData {
    eventArgs: any;
    eventTopic?: string;
    eventName: string;
}
declare const broadcastEvent: TOperation<IBroadcastEventOperationData>;
export default broadcastEvent;
