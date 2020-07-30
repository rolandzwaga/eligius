import { IEventListener } from './types';
import { IAction } from '../action/types';
declare class ActionRegistryEventbusListener implements IEventListener {
    #private;
    registerAction(action: IAction, eventName: string, eventTopic?: string): void;
    handleEvent(eventName: string, eventTopic: string | undefined, args: any[]): void;
}
export default ActionRegistryEventbusListener;
